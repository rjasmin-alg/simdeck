<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-functional-levels — notes

Task `docs/tasks/w3/win-functional-levels.md` (thread t-0428, 2026-11-13). Explorer (steps 0), no kit view. Rules
and expected results: `SPEC.md`.

## Decisions

- **Class explorer (steps 0)**, as the task's table says; its note for the coordinator (reference vs explorer with
  one param) is answered the same way as in `win-ad-structure`.
- **Three ladders, not two.** The task asks for a domain ladder, a forest ladder and "a second domain for the forest
  rule". The second domain gets its own ladder, so rule 2 (forest ≤ lowest domain) is visible as two domain ladders
  beside the forest one. Rungs top-down 2025 … 2003, a dashed gap between 2025 and 2016 reads "2019, 2022: no own
  level" (misconception 3).
- **The second domain is `thornfell.example`** with `thf-dc01`, reused from `win-ad-structure` (a second tree of the
  quillmoor forest, invented there). `brk-dc03` stays in quillmoor.example, as the estate's `forest.txt` has it, so
  the task's caption 1 ("`brk-dc03` runs Windows Server 2012 R2") is about quillmoor.
- **DCs sit under their domain's ladder** (a strip below all three overflowed one screen). Each chip: name and
  "WS <version>"; the new DC is dashed with "new ✓ promoted" or "new ✕ refused".
- **Rung marks:** current = filled `--c1` + "now"; reached = 16 % tint + ✓; raise allowed = thick ink outline + ↑;
  blocked = dashed + ✕ and the first blocker (a DC name, or a domain's first label) and "+n". Colour never alone.
- **Card** (right): for a rung, its status, Unlocks (+), Rules out (−), the Windows Server versions that run at it,
  "Blocked by" (DCs first, then domains: rule 6), and a Raise/Lower button; the forest 2008 R2 rung also has "Turn
  on the AD Recycle Bin". For a DC: OS, domain, the levels it can run at, what it blocks, and "Replace with Windows
  Server 2022 / 2025". Refused actions keep the button focusable (`aria-disabled`) and say why in the caption.
- **Replacing a DC** was added (not in the task) so the student can unblock a raise and see that replacing a DC
  doesn't change the level and raising doesn't change the DCs (misconceptions 1 and 2).
- **`extraDc` gets a fourth option, 2025** (task: none, 2012 R2, 2016). A 2025 DC refused at level 2012 R2 shows
  the other side of "rules out": a level can be too low for new DCs, which also answers "2022 needs a 2022 level".
- **State in hidden params** (`dq`, `dt`, `fl`, `o1`–`o4`, `rb`, `sel`, `last`) as in `win-ad-structure`, so the URL,
  reset and the language switch keep it. `last` records the outcome (`up`, `down`, `no`; `ok`, `no`) and is shown
  only while it still describes the state (SPEC rule 8). Clicking a rung or DC clears it.
- **Captions:** the last action, else the selected rung/DC, else an intro; plus one sentence about the new DC when
  there is one. The task's two captions are used, generalised to any domain/level/DC list.
- **Lowering** is modelled from the archived Microsoft table (see SPEC rule 3), which differs from the task's wording.

## Deviations from the task

- Third ladder; DC replacement; `extraDc` option 2025 (above).
- Unlocks: domain rename moved from domain 2003 to forest 2003 and DC rename added to domain 2003 (archived MS page);
  automatic SPN management for MSAs added to domain 2008 R2; the 2016 NTLM item is MS's three 2016 items (two NTLM, PKInit Freshness); forest 2003
  lists forest trusts. Kerberos armoring stays at 2012.
- Rule 3: forest 2012 R2 lowers to 2008 (not only 2008 R2) with the Recycle Bin off; to 2008 R2 with it on.
- The state carries `extra`, `fits` and `last` beyond the task's `{ domainLevel, forestLevel, dcs, selected }`, and
  levels per domain (`levels: { q, thf }`).
- Owner questions were not added to `docs/tasks/OPEN.md`: the gate's scope rule allows changes only under
  `sims/win-functional-levels/`. They are in the thread report.

## Sources

- Microsoft Learn, "Active Directory Domain Services functional levels in Windows Server" (ms.date 2025-10-30, read
  2026-11-13): levels 2012 R2, 2016, 2025; the DC support matrix (2012 R2: 2012 R2–2022; 2016: 2016–2025; 2025: 2025
  only); "Windows Server 2019 and Windows Server 2022 use Windows Server 2016 as the most recent functional level";
  2016 features (NTLM rolling for PKI-required accounts, network NTLM for device-restricted users, PKInit freshness)
  and forest 2016 PAM; 2025 "Database 32k pages optional feature"; "Domains must use DFSR as the engine to replicate
  SYSVOL" (2016); "You can't set a domain functional level lower than the forest functional level."
- Microsoft Learn (archived), "Understanding Active Directory Domain Services (AD DS) Functional Levels" (2008 R2
  era, updated 2021-11-12): features of 2003–2012; "You can raise the functional level of a domain only if all domain
  controllers in the domain run the version or versions of Windows Server that the new functional level supports";
  both rollback tables, checked row by row (domain: down to 2008 at most, never below the forest, "None unless you
  first lower forest functional level"; forest: Recycle Bin on → never below 2008 R2); "With versions of Windows Server that are earlier than
  Windows Server 2008 R2, you cannot roll back or lower a functional level under any circumstances."
- Estate `student/configs/ad/quillmoor/forest.txt` (Windows2012R2Forest / Windows2012R2Domain, DCs, Recycle Bin
  disabled); `student/configs/ad/pellucid/summary.txt` (a 2012 R2 DC).

## Unchecked *(check)*

- The estate DCs' OS (2012 R2 assumed; the estate gives levels only).
- Floors for 2019 and 2022 DCs at level 2008 (FRS gone after 2016); the current MS page names no floor for them.
- No lowering from 2016 or 2025: MS documents none; modelled as one-way.
- Whether the 32k page feature is per domain or forest-wide; MS lists it under the domain level.
- Whether raising the forest auto-raises lower domains in current Windows Server; the task's rule 2 (refuse while a
  domain is below) is modelled.
- Croatian terms below; `win-dc-promotion` uses "funkcijska razina", this page the task's "funkcionalna razina".

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| functional level | funkcionalna razina (task; `win-dc-promotion` has "funkcijska razina") |
| domain functional level | razina domene |
| forest functional level | funkcionalna razina šume |
| raise | podizanje |
| optional feature | neobavezna značajka |
| AD Recycle Bin | koš za smeće AD-a |
| domain controller | kontroler domene |
| constrained delegation | ograničeno delegiranje |
| fine-grained password policies | fina pravila lozinki |
| authentication mechanism assurance | jamstvo načina prijave |
| claims / Kerberos armoring | tvrdnje / oklop |
| privileged access management | upravljanje povlaštenim pristupom |

## Shared requests

- **kit.css:** `.sd-ctl { display: flex }` beats the `hidden` attribute (same as `win-ad-structure`); worked around
  with `.sd-ctl[hidden] { display: none; }`.
- **check-page:** the one-screen check passed while the lowest rungs were hidden behind the DC strip (nothing
  scrolled). Same request as `win-ad-structure`: check that a stage child does not overflow its own box. Found with a
  screenshot script here.
- **Model promotion:** none needed; `win-ad-structure` has no model in `models/` and this sim reuses only its names
  (thornfell.example). If `win-trusts` or another AD sim needs levels, `sim.js` is pure and promotable as is.

## Tags

Topic `windows-admin`, tag `active-directory` (both in `tags.json`), level `advanced`.

## Time

Start to done in one session on 2026-11-13, 09:42 to 10:10 by the machine clock, 28 min (reading and sources 7,
spec and model 6, page and fitting one screen 7, fresh review in parallel with notes, fixes 8).

## Review

A fresh reviewer read the code against SPEC.md, ran 63 mutations of sim.js (21 survived at first) and probed the page
headless in both languages. Fixed from the review: the Recycle Bin outcome (`rb:on:ok|no`) was never parsed, so turning
it on gave no caption or highlight; "Lower the forest first" was shown when the forest could not go there either (now
the rollback reason wins, and a second sentence says the forest is stuck); the refused new DC's caption named the wrong
level when the forest refused it; focus fell to the page after a successful action (now the rung or DC acted on); a DC
card line that could never show was removed; the 2016 domain level's third feature (PKInit Freshness) was added;
Croatian "od … do", "Svake ljestve", "detaljna pravila za lozinke", the term rule for *domain controller* and *AD
Recycle Bin* in the explanation; neutral bullets in the intro card; "WS" moved into the string tables. New tests kill
the behaviour-changing survivors (Recycle Bin outcome and staleness, `os` staleness, `fits`, the 2012–2025 unlocks,
forest 2016 rule-out, one-way beating the Recycle Bin reason, a vanished selected DC, every action's `last` value).
The remaining survivors are equivalent on this data (a redundant clause in `rollback`, the current level that every
caller short-circuits, inputs the page never sends).
