<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-nis2-scope: notes

New explorer (task `docs/tasks/w3/cmp-nis2-scope.md`, catalogue `cmp-nis2-scope` §4.13). Rules and expected numbers:
`SPEC.md`.

## Decisions

- **The contrast on the stage:** the same organisation on either side of a threshold. The scope table (rows by what
  the organisation is × columns by size) makes both halves of the concept visible at once: moving across a column
  (249 → 250 staff, balance sheet €43M → €44M) changes the class for Annex I, while for an unlisted sector the whole
  row is "–" and size does nothing. "What follows" shows essential and important side by side with the
  organisation's column framed, so a change of class moves the frame.
- **Scope as a table, not a flowchart.** Nine rows: five sector rows (exactly one applies: Annex I, Annex II, central
  government, local government, not listed) and four role rows the student switches on the stage (public electronic
  communications, DNS or TLD registry, qualified trust services, named by the authority). The class is the strictest
  cell over the rows that apply (art. 3(1) lists the essential cases, art. 3(2) makes the rest important); the
  deciding row is the first in table order.
- **Size by the SME Recommendation**, with its two catches made visible: staff "fewer than" (250 is large) and the
  money "turnover *or* balance sheet" (preset `msp`: €62M turnover is still medium with a €38M balance sheet). Each
  figure has its own ruler with the zone it alone would fall in; the size box writes out the ceiling test with ✓ / ✗,
  so the "one of two money figures" rule is read, not told.
- **Ladders instead of free sliders.** The three sliders step through fixed values (staff 13, money 14 each) with
  each ceiling and a value just over it, so every threshold is one key press away on a clicker; free values 1–3 000
  would make 249/250 unreachable by mouse.
- **Public administration as two sectors** (central: essential at any size; local: out unless national law adds it,
  art. 2(5)(a)) rather than a role switch, so that "agency" and "water utility" of the same size can be compared by
  changing only the sector. For public bodies the fine row says national law decides (art. 34(7)).
- **"Named by the authority"** stands for art. 2(2)(b)–(e) and 2(3) (sole provider, critical for society, critical
  entities under Directive (EU) 2022/2557) and gives essential (art. 3(1)(e), (f)). The state can name only an entity
  of a type in Annex I or II, so the switch is idle for an unlisted sector or local government (the caption says so).
  Simplification: the state can also identify such entities as *important* (art. 3(2)); not modelled.
- **Telecom row** follows art. 3(1)(c): essential from medium size, important when micro or small (in at any size by
  art. 2(2)(a)(i)).
- **Fines**: the directive's numbers are "a maximum of at least", so the page says "Maximum fine at least" and shows
  the ceiling for the organisation's own turnover, both classes side by side, and which part decides (crossover at
  €500M for both classes). The turnover in the directive is the undertaking's worldwide turnover; the page uses the
  organisation's turnover (a group is out of scope, see "Simplified" in the explanation).
- **No article numbers on the stage**; they are in the explanation only (task's compliance notes).
- **Controls:** sector (drop-down, 18 sectors with their annex in the label) and the three sliders in the panel; the
  four role switches on the stage (aria-pressed buttons as row headers) and hidden in the panel for the URL and the
  reset, as `cmp-dpia-triage` does.
- **Changed marks:** the size box, the verdict box and any row header whose applies-state changed (`.sd-changed`).
- **Model module:** `nis2.js` (size, rows, class, thresholds, fine) is pure, wordless and registers on
  `SimdeckModels.nis2`, ready for promotion; `cmp-cost-of-noncompliance` needs `fine` and the class.
- **No glossary terms** (`[[…]]`): the explanation writes the pairs out, as the other `cmp-` pages do; the page does
  not link `glossary.js`.

## Deviations from the task

- The task's "Model and presets" section was empty; `SPEC.md` fills it.
- Six presets (the task allows 3–6): telecom and local government are left for the student to try (the table shows
  their rows).
- The brief says to add owner questions to `docs/tasks/OPEN.md`, but COMMON.md §9 and the gate's scope check allow
  only `sims/cmp-nis2-scope/`; open questions are in the report instead.

## Sources

- Directive (EU) 2022/2555 (NIS2), EUR-Lex: art. 2(1) (medium and larger in Annex I/II), 2(2)(a) (electronic
  communications, trust service providers, TLD registries and DNS service providers regardless of size), 2(2)(b)–(e)
  (identified by the state), 2(2)(f) (public administration), 2(3) (critical entities), 2(5) (local administration,
  education optional), 3(1)(a)–(f) and 3(2) (essential, important), 3(3) (the list), 4 (sector-specific acts such as
  DORA), 20, 21, 23 (governance, measures, reporting), 32 and 33 (supervision ex ante and ex post; 32(5) temporary
  ban), 34(4), (5), (7) (fines), Annexes I and II (sectors). *(check: article and point numbers against EUR-Lex; read
  from memory of the text, not re-fetched in this session)*
- Commission Recommendation 2003/361/EC, Annex art. 2 (ceilings: < 250 staff and ≤ €50M turnover or ≤ €43M balance;
  < 50 and ≤ €10M; < 10 and ≤ €2M), art. 3 and 6 (partner and linked enterprises), art. 4(2) (two consecutive
  periods). *(check: same)*
- The Croatian terms of the official Croatian text of NIS2 (ključni subjekt, važni subjekt, sektori visoke
  kritičnosti, ostali kritični sektori) and of the Recommendation (godišnje jedinice rada, godišnji promet, ukupna
  godišnja bilanca). *(check: against the HR versions on EUR-Lex)*
- Numbers checked by the script quoted in `SPEC.md` and by `sim.test.js` (every sector × staff × money corner ×
  role combination for the caption keys).

## For the owner

From catalogue §4.13, "Where Croatian and EU practice matters". None of it is on the page; the page names only the
Zakon o kibernetičkoj sigurnosti as the Croatian implementation (as `cmp-incident-clocks` does).

- The Zakon o kibernetičkoj sigurnosti (NN 14/2024) and the government regulation under it *(check the regulation's
  name and number; source: Narodne novine)*.
- In Croatia the competent authorities categorise entities and notify them, rather than entities deciding for
  themselves *(check; source: the Zakon, the articles on categorisation)*. The page says only that the state keeps
  the list (art. 3(3)).
- Whether the Croatian law adds local and regional self-government units and education institutions (art. 2(5))
  *(check; source: the Zakon's annexes)*. The page shows local government as out "unless national law brings it in";
  if the Zakon does include them, that is already the Croatian reality and a Croatian IT manager in a municipality is
  in scope: the owner may want a line in the explanation or a preset once this is confirmed.
- Which body supervises which sector, and the national fine amounts and whether public bodies are fined (art. 34(7))
  *(check; source: the Zakon)*.

## Term pairs

Not in `kit/glossary.js`; chosen here, for the owner to check in one place. Settled terms used as given: ključni i
važni subjekti, nadzorno tijelo.

- *essential entity* (ključni subjekt), *important entity* (važni subjekt), *out of scope* (izvan opsega),
  *sectors of high criticality* (sektori visoke kritičnosti), *other critical sectors* (ostali kritični sektori).
- *micro, small, medium-sized, large enterprise* (mikro, malo, srednje, veliko poduzeće), *staff headcount in annual
  work units* (broj zaposlenih u godišnjim jedinicama rada), *annual turnover* (godišnji promet), *annual balance
  sheet total* (ukupna godišnja bilanca), *ceiling* (granica).
- *DNS service provider* (pružatelj usluga DNS-a), *top-level-domain name registry* (registar naziva vršne domene),
  *qualified trust service provider* (kvalificirani pružatelj usluga povjerenja), *public electronic communications
  networks or services* (javne elektroničke komunikacijske mreže ili usluge), *central government* (središnja
  državna uprava), *local government* (lokalna samouprava), *managed (security) service provider* (pružatelj
  upravljanih (sigurnosnih) usluga), *competent authority* (nadležno tijelo).
- *ex ante / ex post supervision* (nadzor unaprijed i naknadno), *management body* (uprava; the directive says
  upravljačko tijelo *(check)*), *temporary ban from managerial functions* (privremena zabrana obavljanja upravljačke
  funkcije).

## Shared requests

- **Promote `nis2.js` to `models/nis2.js`** for `cmp-cost-of-noncompliance` (class and `fine`) and any later NIS2 page;
  this sim then includes `../../models/nis2.js` instead of its copy. Its tests are the "scope functions" block of
  `sim.test.js`.

## Checks

- `node --test sims/cmp-nis2-scope/sim.test.js`: tie-breaks first (250 staff, money on the ceiling, one money figure
  enough, the deciding row order, the fine at €500M, named on an unlisted type), the scope functions, then rules
  2–10, the presets, and the generic block.
- `npm run gate -- cmp-nis2-scope`: pass (46/46 browser checks). Screenshots at 1920×1080 light, dark, grayscale,
  help, panel hidden and 375×812 in hr and en reviewed, plus presets shop (en, with named switched on), dns (hr),
  agency (hr, dark), machines (en) and a small telecom (hr). Clicks checked in a browser: a role button switches the
  class (retail chain + DNS → essential); Enter on a focused button keeps the focus; no console errors.
- Fresh reviewer (a separate agent, no part in the build) read the code against `SPEC.md` and ran 88 single mutants
  of `nis2.js` and `sim.js` on a scratch copy: no wrong result found; 25 survived at first. The real gaps are now
  killed by new assertions (sector → group list and the three ladders compared literally, a role that is `'true'`
  but not `true` does not make the type listed, the `down` loop reaching micro, `flipped` with no next state). The
  13 left are equivalent (e.g. `classAt` `>` → `>=`, the caption notes in another order where the cases never
  overlap: an idle `named` implies no leading row; a class with both an up and a down is always important).
  Its legal and wording findings were applied: telecom row also cites art. 3(1)(a); the management row says the
  temporary ban does not apply to public administration (art. 32(5)); "significant incident" in the obligations;
  important-entity supervision on "evidence, an indication or information" (art. 33(1)); "named by the state"
  instead of "the authority" (art. 2(2)(b)–(e) say the Member State); Croatian agreement in `capOut_unlisted`,
  "sektor iz Priloga II" instead of the singular "ostali kritični sektor", "Iste za oba razreda", "te može
  obuhvatiti", "Mala tvrtka koja vodi DNS"; English captions "A {size} in …"; the SPEC's count of caption keys (12).

## Time

Start 19:06, done 19:28 (2026-11-07), one session.
