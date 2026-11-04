<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-ou-vs-group — notes

Task `docs/tasks/w3/win-ou-vs-group.md` (thread t-0241, 2026-11-04). Stepper, no kit view. Rules and expected
results: `SPEC.md`.

## Decisions

- **Layout: tree | groups | deck.** The task puts the deck in the centre between the OU tree (left) and the groups
  (right). Here the groups sit next to the tree and the deck with its bins is on the right, so the lines from `ana`
  (in `OU=HQ`) to her three groups do not cross the deck. The same SVG layer draws a dashed line for the delegation
  (`OU=Brackenridge` → `Helpdesk`) and a dotted one for the security filter (`Drive P` on `OU=Staff` → `G-Projects`).
  On a phone the lines are off; every link is also written in the chips (`member ana`, `gets: … on …`, `filters …`).
- **Four bins, not three.** The task's eighth card has the answer "neither until moved to an OU", so the deck has a
  fourth bin, "neither". The OU bin is labelled "OU (or domain)", since rule 1 allows a domain link and the
  quillmoor deck's drive maps sit on the domain root.
- **The answer is derived, not typed in.** Each card states a need (policy for some boxes, a permission, a delegation,
  a membership, a mailing list); `classify()` applies the rules and returns the answer and the mechanism. The decks'
  bins in SPEC §3 are test expectations.
- **The top card is the question.** At step n the bins hold cards 1…n (card n highlighted, its mechanism lit), and
  card n+1 is face up on the deck, so the class can guess before the next step. The caption explains the card just
  turned.
- **Quiz mode:** the bins are buttons; a click stores the guess in a hidden param `g<k>` and steps forward, so the
  card turns at once. → without a click turns the card as "no answer", so a clicker never gets stuck. The verdict is
  right, half (one half of a "both"), wrong or no answer; the score shows at the end. Show mode ignores guesses.
  Guesses are hidden `select` params, as `win-ad-structure` keeps its state, so the URL, reset and the language
  switch keep them.
- **`deck` is a visible choice** (8 cards | Quillmoor estate) as well as a preset, so the two decks can be swapped
  without losing the mode. `sim.json` `steps` is 8, the default deck's; the quillmoor deck has 4.
- **Mechanisms stay lit** after their step (not highlighted), so the directory fills up with links, ACEs and
  delegations over the demo; the last card's is highlighted. A GPO link that is now also marks the boxes it reaches
  with a thick left bar.
- **Highlight fill:** the kit's `.sd-changed` is only an outline and a ring, so the page adds the `--hl` fill wherever
  it writes `--on-hl` text (in dark mode dark text on the dark panel was unreadable).

## Deviations from the task

- Layout as above (deck on the right, not in the centre).
- A fourth bin, "neither".
- Card 4: `ana` is in `G-Accounting`, `G-Projects` and `All Staff` (the scene's groups) instead of the task's
  "Sales" and "Project-X". Card 1 says "every workstation" for the task's "all laptops" (the tree has
  `OU=Workstations`, no laptop OU).
- Added group `Board` (distribution) for card 5, and `OU=Kiosks` under `OU=Workstations` for card 6; both invented.
  `OU=Kiosks` is not drawn in the quillmoor deck, which shows only the estate's boxes.
- Card 6 is "kiosk PCs may not read USB drives" instead of the task's "hide Control Panel": that is a user setting,
  and a GPO linked to an OU of computers would not reach it without loopback (found by the review). Card 1 says
  "after 10 idle minutes" (the machine inactivity limit, a computer setting).
- GPO names `Screen Lock`, `Kiosk Lockdown`, `Drive P`, `Staff Settings` are invented; `Chirp Autostart` and
  `Drive Maps` are the estate's (`gpos.txt`).
- The quillmoor preset has four cards (the task gives its theme, not the cards): Chirp Autostart on the workstations
  (35 in the OU per `ou-tree.txt`, 38 per the GPO's comment in `gpos.txt`); the 159 in `CN=Computers` (neither,
  until moved into `OU=Workstations`); `Drive Maps` for everyone, `CN=Users` too (domain root link, which is why it
  reaches the 155 there); who may open `\\hq-fs01\projects` (a group: a drive map is policy, access is an ACE).
- The model is copied from `sims/win-ad-structure/sim.js @ 697a662` (the OU boxes of domain q), not taken from
  `models/`: nothing is promoted there yet. Only the container list is reused, with `OU=Kiosks` added; the rest
  (LCA, reach, trustees, classify) is new.
- Owner questions are in the thread report, not in `docs/tasks/OPEN.md`: the gate's scope rule allows changes only
  under `sims/win-ou-vs-group/`.

## Sources

- Estate `student/configs/ad/quillmoor/ou-tree.txt` (OUs and counts: 155 users in `CN=Users`, 159 computers in
  `CN=Computers`, 35 in `OU=Workstations`), `gpos.txt` (Chirp Autostart on `OU=Workstations` "only 38 computers are in
  that OU"; Drive Maps on the domain root with `P: \\hq-fs01\projects`), `users.csv` (HQ staff in
  `OU=HQ,OU=Staff,OU=Quillmoor`).
- `sims/win-ad-structure` (scene, OU tree, the quote from Microsoft Learn "Redirect users and computers containers":
  "Group policies can be applied on OU containers but not on CN class containers").
- Microsoft Learn, named by the task, not fetched in this session: "Group Policy overview", "Link a Group Policy
  Object", "Security identifiers", "Active Directory security groups", "Delegating administration by using OU
  objects". MS-ADTS for one parent per object and multi-valued `member` / `memberOf`.

## Unchecked *(check)*

- The RIDs 1104–1107 and ana's 1201 are invented; the domain part of the SID is shown as `S-1-5-21-…`.
- A distribution group has a SID (shown, RID invented) but is not security-enabled, so it never stands in an ACE;
  the page says "not for ACLs" *(check: Microsoft's wording)*.
- Delegation is modelled on an OU, the domain or a `CN=` container (all can be delegated in AD); the cards only
  delegate on an OU.
- Card 7's security filtering: since the 2016 Group Policy security update, computers also need Read on a
  user-filtered GPO. Not on the page (`win-gpo-security-filtering`).
- `Chirp Autostart` sets an `HKCU Run` key (a user setting) but is linked to an OU of computers. The caption says its
  scope is the computers there and that it works there only with loopback processing; loopback itself is not
  modelled.
- Microsoft's Croatian terms: organizacijska jedinica, sigurnosna grupa, distribucijska grupa, delegiranje.

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| organizational unit | organizacijska jedinica (check) |
| security group | sigurnosna grupa (check) |
| distribution group | distribucijska grupa (check) |
| permission | dozvola (UL ch07) |
| container (CN=…) | spremnik (from win-ad-structure) |
| member | član (ana: članica) |
| loopback processing | obrada povratne petlje (check) |

Used from the glossary: `[[delegation]]` (delegiranje), `[[access control list]]` (popis kontrole pristupa).

## Shared requests

- **kit.css:** `.sd-ctl { display: flex }` beats the `hidden` attribute (also reported by `win-ad-structure`,
  `win-group-scopes`, `win-dhcp-scope-options`); worked around with `.sd-ctl[hidden] { display: none; }` in the page.
- **kit.css:** `.sd-changed` has no fill, so a page that sets `--on-hl` text on it needs its own `--hl` background, or
  the text vanishes in dark mode. A `.sd-changed-fill` helper (fill + on-hl text) would save each page the rule.
- **models/:** the quillmoor OU tree (boxes, parents, counts) is now copied in two sims; worth promoting as
  `models/ad-quillmoor.js` (boxes, `pathTo`, `lcaOf`, `reachOf`, `canLinkGpo`).

## Tags

Topic `windows-admin`, tag `active-directory` (both in `tags.json`), level `intro`.

## Time

One session on 2026-11-04, 04:54 to 05:16 by the machine clock (22 min: reading 5, spec and model 4, strings and
page 4, fitting and screenshots 3, review and fixes 6).

## Review

A fresh reviewer read the code against SPEC.md and ran 82 mutations of sim.js: 49 killed, 33 survived. Tests added
for every survivor that changes what the page shows (bins before a card turns, `neither` on a `both` card, a link's
reach and the refused link's box, the mailing list lit, the rights, share and GPO names in each mechanism, the scene's
kinds and counts) and for the edge cases (domain and user as trustee, unknown mail group and user, empty boxes,
unknown mode, rule numbers). Re-run: everything killed except four equivalent ones (`scoreOf` without the revealed
check, `membersOf` with one user, `mech.boxes` unused by the page, and the lines rewritten below).
Fixed from the review: the kiosk card's user setting (above); the Chirp caption claimed it reaches the computers
(it sets a user setting); a distribution group was drawn without a SID and labelled "no ACL"; the `exact` rule only
refused a container (now any link box that is not one of the boxes asked for, as SPEC says); delegation on a
container was refused; OU rows now say "no SID" during the permission cards; the delegated or refused row is
outlined; Croatian "član" for ana, the quiz hint, "— oboje"; the drive-maps and projects-share wording.
