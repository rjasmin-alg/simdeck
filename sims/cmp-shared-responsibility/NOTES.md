<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-shared-responsibility: notes

New explorer (task `docs/tasks/w3/cmp-shared-responsibility.md`, catalogue `cmp-shared-responsibility` §4.13).
Rules and expected numbers: `SPEC.md`.

## Decisions

- **The contrast on the stage:** what the contract says against what the team believes, row by row. Twelve controls
  in five layers; four columns show the owner under own servers, IaaS, PaaS and SaaS, so the provider's share climbs
  as a staircase from the building up; the chosen model's column is outlined and its header has a ▾. Beside it the
  team's belief (a button per row), the outcome (✓ matches, ✗ gap, ≈ double work) and what the provider's report says.
- **One owner per row, five layers, a strict line.** Each model hands the lowest n layers to the provider (0, 2, 3, 4);
  the data-and-access layer never moves. Real contracts share some rows (network rules, encryption keys); the page
  says once that it simplifies, and the explanation says rows can be shared.
- **Gap and double work.** A marked row the customer owns is a gap (nobody runs it); an unmarked row the provider owns
  is double work (the team plans what it cannot reach, and the evidence must come from the provider anyway). On own
  servers every mark is a gap. Beliefs are kept when the model changes, so moving the system from own servers to IaaS
  with nothing marked shows four rows of double work, which is the lift-and-shift habit.
- **The beliefs live in a hidden `mask` param** (a bit per control, 0–4095), so a deep link keeps them (the pattern of
  `cmp-restore-evidence`'s `plan`). The page needs `.sd-ctl[hidden] { display: none; }` for the hidden control, as
  `cmp-jml-drift`, `cmp-change-risk-class` and `cmp-restore-evidence` do (see Shared requests).
- **The report** is a card on the stage (a button) and a toggle in the panel. It proves provider rows only; customer
  rows are "not in it" (the report lists them as complementary user entity controls, i.e. it assumes you run them);
  on own servers there is no report. **Carve-out** (a second toggle, shown when the report is open) marks the building
  rows as carved out: the provider rents its data centre and that operator's own report is needed. This stays inside
  the one concept ("the report is evidence only for its own part"); the provider's own part can be narrower than its
  layers.
- **"Mark as the contract says"** button sets the mask to the provider's rows for the chosen model, so a lecturer can
  reset the beliefs to correct and then break one. A "clear the marks" button was dropped to keep the panel on one
  screen; R (reset) restores the preset's marks.
- **Caption:** the model's line, then at most two notes in the order gap, report, double work; the reminder that data,
  accounts, access and backups stay with the customer (nKeep) only when nothing else applies, so the caption stays at
  about three lines. The first gap named is the topmost in register order (the data layer first).
- **The workload** is the order system of a small made-up web shop (the same kind of firm as `cmp-bia` and
  `cmp-vendor-tiers`). No provider, product or tool is named. IaaS, PaaS and SaaS are generic service models (NIST
  SP 800-145), used in brackets after the Croatian and English names.
- **No numbers to make up** except counts; the page has no illustrative amounts, so the foot says "simplified, not
  legal advice" and that the firm is made up, not that numbers are illustrative.
- **Colour never alone:** provider chips are filled with ☁, customer chips outlined; the belief button for "customer"
  is dashed; gap rows have a dashed outline, ✗ and a red subline; double work a dotted outline, ≈ and an italic
  subline; report states have ✓, ⧉ or –. Grayscale screenshots checked.
- **No glossary terms** (`[[…]]`): the explanation writes the pairs out, as the other `cmp-` pages do; the page does
  not link `glossary.js`.
- **Phone:** the table becomes cards per control with layer headings; only the chosen model's owner chip shows (the
  model is switched in the panel).

## Deviations from the task

- The task's "Model and presets" section was empty; `SPEC.md` fills it.
- The brief says to add owner questions to `docs/tasks/OPEN.md`, but COMMON.md §9 and the gate's scope check allow
  only `sims/cmp-shared-responsibility/`; the open questions are in the report instead.
- No shared model: §5.24 lists this sim as linking `fin-cloud-commitment`, not as a user of the four shared models
  (people × roles, risk scoring, incident clocks, evidence trail). Its model (`owner`, `outcome`, `evidence`) is pure
  and could be promoted if a later sim needs it.

## Sources

- GDPR, Regulation (EU) 2016/679, art. 24 (controller's responsibility), art. 28(1) (processors with sufficient
  guarantees), art. 28(3)(h) (information to demonstrate compliance; audits and inspections), art. 32 (security of
  processing, controller and processor), EUR-Lex. *(check: the official Croatian wording of 28(1) and 28(3)(h); the
  page paraphrases)*
- NIS2, Directive (EU) 2022/2555, art. 21(2)(d) (supply chain security). *(check: the Croatian "sigurnost lanca
  opskrbe" against the official text)*
- ISO/IEC 27001:2022, Annex A 5.23 (information security for use of cloud services), by number only. *(check: number
  from the edition's contents)*
- DORA, Regulation (EU) 2022/2554, art. 28–30 (ICT third-party risk, key contractual provisions). *(check: the
  range)*
- NIST SP 800-145, The NIST Definition of Cloud Computing (the three service models), for the builder.
- Assurance reports, complementary user entity controls and the carve-out method are described from general audit
  practice (independent service auditor's reports on a service organisation's controls); no standard or report type
  is named on the page. *(check: whether the owner wants the standard named in the explanation)*

## For the owner

From catalogue §4.13, "Where Croatian and EU practice matters" (nothing there is specific to this entry; not on the
page):

- The split between the Hrvatska narodna banka and HANFA *(open: not stated by the owner; source: the HNB and HANFA sites)*. A DORA preset
  was not built.
- How the Zakon o kibernetičkoj sigurnosti (NN 14/2024) and its implementing regulation phrase the supply-chain and
  cloud measures *(open: not stated by the owner; source: Narodne novine)*.
- Cloud computing service providers are themselves entities under NIS2 (Annex I, digital infrastructure) *(check;
  not on the page)*.

## Settled

- Financial entities follow DORA for ICT third-party risk, with a register of ICT third-party arrangements and
  contract terms (art. 28–30); the supervisors are the Hrvatska narodna banka and HANFA: owner confirmed 2026-11-08. Not on the page; the
  catalogue line does not name this entry.

## Term pairs

Not in `kit/glossary.js`; chosen here, for the owner to check in one place:

- *shared responsibility* (podijeljena odgovornost, the catalogue's title), *provider* (pružatelj), *customer*
  (korisnik), *own servers* (vlastiti poslužitelji), *rented infrastructure / IaaS* (iznajmljena infrastruktura),
  *platform / PaaS* (platforma), *finished application / SaaS* (gotova aplikacija).
- *gap* (praznina), *double work* (dvostruki posao), *hardening* (ojačavanje sustava), *server room* (poslužiteljska soba),
  *data-centre operator* (operater podatkovnog centra).
- *assurance report* (izvješće neovisnog revizora o kontrolama pružatelja; on the stage "izvješće pružatelja"),
  *carve-out* (izuzeće; on the stage "izuzeto"), *complementary user entity controls* (komplementarne kontrole
  korisnika).
- GDPR terms as in the official Croatian text: *controller* (voditelj obrade), *processor* (izvršitelj obrade).

## Shared requests

- **Kit: `.sd-ctl[hidden]` should hide.** `kit.css` sets `.sd-ctl { display: flex }`, which overrides the `hidden`
  attribute the kit sets for a param whose `visible()` is false; a hidden param (here `mask`, and the `carve` toggle
  while the report is closed) stays on screen. This page adds `.sd-ctl[hidden] { display: none; }`, the fourth page to
  do so. The smallest fix: add that rule to `kit.css`.

## Checks

- `node --test sims/cmp-shared-responsibility/sim.test.js`: 22 tests, tie-breaks and boundaries first (register order
  of gaps and double work, the strict "below" of the layer line, mask ends), then rules 1–7, the presets against SPEC,
  and the generic block.
- `SPEC.md`'s Python re-implementation against `compute`: every model × report × carve × all 4 096 masks, 65 536
  cases, 0 mismatches.
- `npm run gate -- cmp-shared-responsibility`: pass (46/46 browser checks). Screenshots at 1920×1080 light, dark,
  grayscale, help, panel hidden and 375×812 in hr and en reviewed; plus every preset in both languages at 1920×1080
  with a script that measures panel overflow and clipped row text (none), and saasReport at 375×812.

- Fresh reviewer (a separate agent, no part in the build) read the code against `SPEC.md` and ran 32 mutants of
  `sim.js`: 5 survived. Three are equivalent (rounding after the clamp, the empty-string guard, two owners only). Two
  could change the page and are now killed by tests: dropping the two-note limit, and checking carve before own
  servers. Applied as well: the sources section in `SPEC.md`; the SPEC legend matched to the page; "u redu" → "poklapa
  se" (the belief matches the contract, not "the control is fine"); the double-work note says the evidence comes "from
  outside", not "from the provider", since with carve on it can come from the operator; the OS-patch gap line no
  longer repeats its row name; "poslužiteljska soba" throughout.

## Time

Start 20:57, done 21:35 (2026-11-07), one session.
