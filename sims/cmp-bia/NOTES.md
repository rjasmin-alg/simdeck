<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-bia: notes

New explorer (task `docs/tasks/w3/cmp-bia.md`, catalogue `cmp-bia` §4.13). Rules and expected numbers: `SPEC.md`.

## Decisions

- **The contrast is the stage.** The same graph and the same numbers, analysed two ways: *direct users only* (each
  system gets an RTO only from the processes that use it directly, as when every system owner is asked separately)
  against *the whole chain*. Direct: the infrastructure has no RTO, goes last in the order, the work list is empty,
  and three of five processes are still late. Chain: network and name resolution jump to 3 h, the directory to 23 h,
  and the work list names exactly the systems that make the processes late. The mode is a panel switch, so the
  lecturer flips it in place (faultline's "the counterfactual is a control").
- **Three rows, fixed positions.** Processes, applications, infrastructure as a graph: five equal columns without
  gaps, so a card's centre is at (2k + 1) × 10 % and the edge bands are SVGs with `preserveAspectRatio="none"` (no
  text in them, no measuring). The infrastructure chain (directory → name resolution → network) is fixed and drawn
  as arrows between the cards; processes reach the infrastructure only through applications. Row labels are
  vertical to leave the cards room for a stepper on one line.
- **Drawing dependencies.** ⇣ on a process or application card selects it; the row below then shows ✓ / + toggles,
  and the selected card's lines turn thick and blue. Edges live in two integer bit masks (`pa`, `ai`) as hidden range
  params, so a drawn graph survives the URL and a language switch. The selection itself is page state, not a param.
- **Margin.** "Its RTO must be below that" is the time to notice and decide (0–3 h, a panel choice), subtracted from
  the MTD. Preset 5 shows a fixed estate falling back into gaps when the decision takes 3 h.
- **Parallel restore.** A process is back when the slowest system in its closure is, after the margin. This keeps
  the rule the concept states exact: in chain mode, an empty work list ⇔ every process in time (tested on random
  graphs). Sequential restore (times adding up) would be a second concept; the explanation and the foot say the page
  assumes parallel restore.
- **Recovery order.** Required RTO, then depth (the longest chain below), then a fixed list with the infrastructure
  first. In chain mode that is always a valid restore order (a dependency never needs more time than its dependent);
  in direct mode the caption points out the application placed before a system it cannot run without.
- **One fictional firm**, no name needed on the page: five processes, eight systems, all hours made up; the foot says
  so once with "simplified, not legal advice". No product names: "business system (ERP)", "directory and sign-in",
  "name resolution (DNS)" are categories. No answer keys: nothing from `dr-lecture-estate/instructor/`.
- **Defaults = preset 1** (the shortcut), as the other `cmp-` explorers start from the uncontrolled state.
- **One model file.** None of §5.24's four shared models applies. `adjacency`, `closure`, `depth`, `required`,
  `order` and `outcome` are pure over plain data; `cmp-restore-evidence` ("RTOs from cmp-bia") can copy `required`.

## Deviations from the task

- The task's "Model and presets" section was empty; `SPEC.md` fills it.
- The brief says to add owner questions to `docs/tasks/OPEN.md`, but COMMON.md §9 and the gate's scope check allow
  only `sims/cmp-bia/`; open questions are here and in the report.
- `ha-never-zero-spof` (named in the catalogue's seed) does not exist as a sim; `related` lists `rpo-rto`,
  `faultline`, `fin-downtime-cost`.

## Sources

- ISO 22301:2019, clause 8.2.2, business impact analysis *(check the clause number and that MTD corresponds to its
  "maximum tolerable period of disruption", MTPD)*. Number only; the text is paid.
- ISO/IEC 27001:2022, Annex A 5.30, ICT readiness for business continuity *(check)*.
- NIS2, Directive (EU) 2022/2555, art. 21(2)(c): business continuity (backup management, disaster recovery) and
  crisis management (EUR-Lex) *(check the official Croatian wording: "kontinuitet poslovanja … oporavak od
  katastrofe")*.
- DORA, Regulation (EU) 2022/2554, art. 11, ICT business continuity policy; the BIA requirement is in art. 11(5)
  *(check the paragraph)*.
- faultline (`/home/rjasmin/projects/faultline/PEDAGOGY.md`, `js/engine/`): the hidden-dependency framing and
  "start from a broken estate, the counterfactual as a control". No code copied: the graph here is three fixed layers.
- Every hour on the page is illustrative; the page says so.

## For the owner

- No Croatian-specific number is on the page. The Zakon o kibernetičkoj sigurnosti (NN 14/2024) and its regulation
  presumably carry NIS2 art. 21's continuity measure into Croatian law *(check how the regulation words business
  continuity and whether it requires a BIA by name; source: Narodne novine)*. Not cited on the page.
- Whether "time to notice and decide" should be a separate named term (some methods split MTD into RTO + work
  recovery time, WRT, after the restore instead). The page puts the margin before the restore; both readings give
  "RTO below MTD".
- Whether a DORA preset (financial entity) is wanted: the BIA rule is the same, so it was left out.

## Term pairs

Not in `kit/glossary.js`; chosen here, for the owner to check in one place:

- *business impact analysis* (analiza utjecaja na poslovanje, BIA; the catalogue's title), *work list* could be *popis poslova* (the reviewer's suggestion; the page says *lista poslova*), *maximum tolerable
  downtime* (najdulji podnošljivi prekid, MTD) *(check: HRN EN ISO 22301 may use "najdulje prihvatljivo razdoblje
  prekida")*, *recovery time objective* (ciljno vrijeme oporavka, RTO; as `rpo-rto` writes it), *recovery order*
  (redoslijed obnove), *work list* (lista poslova), *gap* (jaz), *direct users* (izravni korisnici), *the whole chain*
  (cijeli lanac), *time to notice and decide* (do odluke o obnovi), *directory and sign-in* (imenik i prijava), *name
  resolution* (razlučivanje imena), *business system* (poslovni sustav), *warehouse system* (skladišni sustav),
  *payroll system* (obračun plaća), *business continuity* (kontinuitet poslovanja), *disaster recovery* (oporavak od
  katastrofe).

## Shared requests

- For the kit: `.sd-ctl[hidden] { display: none; }` again (as in the other `cmp-` sims).
- For the kit: the small stage button and − value + stepper (`.bi-b` here; `.rh-b`, `.ps-b`, `.pa-b`, `.sx-b`
  elsewhere): a fifth sim draws the same control.
- For the kit (maybe): a param type for a set of edges or flags (here two integer bit masks in hidden ranges).

## Checks

- `node --test sims/cmp-bia/sim.test.js`: tie-breaks and boundaries first (order by depth, then the list; the first
  process names the requirement; the slowest system; the worst gap; achieved = required; back = MTD; nearest step),
  then rules 1–9, three property tests on seeded random graphs (chain order is always valid; the outcome does not
  depend on the mode; empty work list ⇔ all in time), the presets against SPEC, the generic block.
- Mutation check (mine): 33 deliberate breaks of `sim.js`; 31 failed a test at once. Two survived: nAllOk's guard
  "and an empty work list" was equivalent (implied in chain mode by rule 7) and was dropped; the depth tie-break
  gained a test where depth and the list disagree. Rerun: 32 of 32 fail a test.
- Python re-implementation from SPEC.md alone (`SPEC.md`, `bia.py`): 20 005 cases (the presets and 20 000 seeded
  random param sets), 0 mismatches with `compute`.
- Fresh reviewer (a separate agent, no part in the build): 5 000 tie-heavy random cases of `bia.py` against `compute`,
  0 mismatches; its own mutants left seven rules or tie-breaks unpinned (the slowest system's depth and list
  tie-breaks, nMargin's boundary and order, the work and broken lists' order, the empty-string and rounding cases of
  rule 8), each now has a test: 42 of 42 mutants fail. Applied from its report: Croatian agreement with feminine
  "Mreža" (notes now say "taj sustav"), "za {sys}" case, "smije stajati" / "may be down for"; the RTO's starting
  point (here from the decision to restore, unlike `rpo-rto` and ISO 22301, which count from the incident) said in
  the explanation; the order is a priority when hands are short, since the times assume parallel restore; "gotovo
  svi / almost all" (orders never reach the directory); nAllOk only when some system has an RTO; no double
  parentheses in nMiss; "Tko određuje RTO sustava"; "Izvori:"; the order chips lost their gap text so they stay on
  one row; names no longer break mid-word; below 1000 px of height the stage scrolls inside itself. Not applied:
  "popis poslova" for "lista poslova" (listed under term pairs for the owner); a test of the caption placeholder code
  in `index.html` (exercised by the reviewer in a browser with edge states, no errors).
- `npm run gate -- cmp-bia`: see the report; screenshots at 1920×1080 light, dark, grayscale and 375×812, both
  languages. First layout clipped the infrastructure row (labels in a 8.5 rem column pushed the steppers onto a
  second line); vertical row labels and one-line tiles fixed it. The ✓ / + toggles replaced "needed / add" labels
  that overflowed narrow cards.

## Time

Start 19:32, done 20:00 (2026-11-07), one session, including the fresh review and its fixes.
