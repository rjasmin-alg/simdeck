<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-alert-states: notes

New stepper (task `docs/tasks/w3/lnx-alert-states.md`, catalogue `lnx-alert-states` §4.4, wave 3). One concept:
scrape, the `for:` duration, pending → firing, flapping. Rules and expected numbers: `SPEC.md`.

## Decisions

- **Drawn by the page:** no kit view has a time axis. Three lanes on one axis of n minute columns: the metric (a line
  with a dot per minute: filled = scraped, hollow = not scraped, small grey = not yet; the threshold dashed red), what
  the rule sees (the held sample per minute, solid box when scraped, dashed when held, ✓/✗ and a thick border when the
  condition is true), and the state band (blank = inactive, hatched amber with "k/for" = pending, solid red with a bell
  = firing, a dashed inner outline = firing only because of `keep_firing_for`). The current minute is a tinted column.
  The future metric is shown dotted, so the class sees the shape it feeds the rule.
- **Cards above the lanes:** the rule as YAML (`expr`, `for`, `keep_firing_for`, `scrape_interval`,
  `evaluation_interval`; the configuration is the subject, so it appears, in `translate="no"`), the alert's state
  badge, what it waits for, `activeAt` and the last sample, and the notifications counter.
- **Two counters, fired and resolved**, instead of the task's one `cycles` counter (Deviations). `cycles` (rule 6)
  stays in the state as the resolved count.
- **Steps = the series' length** (15 or 10), `steps(p)`; `sim.json` has the default's 15. `series` and `scrape`
  reset to minute 0 (task); `threshold`, `forMin` and `keepFiringFor` replay to the same minute, so a slider moved at
  minute 8 shows at once what that `for` would have done.
- **`series` and `scrape` are `choice` controls**, not selects (kit: select is for more than five options). The
  panel's segmented buttons get a smaller inline padding so the four Croatian series fit in one row (the panel
  overflowed by 3 px otherwise).
- **Scrape phase:** scrapes at minute 1 and every `scrape` minutes after (the task's "samples at 1,3,5,7,9" for 2 min).
  With 5 min (1, 6, 11) the one-minute spike at 6 **is** scraped and then held for 5 minutes, so it fires 6–10: kept,
  it is true to the model and shows that the phase decides; tested.
- **No data before the first scrape** is "condition false" (an empty query result).
- **Captions** start with the event (so minute 8 of `sustained` is the task's caption verbatim in both languages) and
  end with the scrape: the new sample, or the held one, plus "it does not see the real value" when the real value
  would have given a different condition.
- **Term rule** without glossary entries: state names in italics, on the Croatian page with the Croatian in
  parentheses (`term()` in the page; strings `pending` + `pendingHr`). The English tables carry the same keys
  (`pendingHr: 'pending'`), unused, so the tables match.
- **Preset entries** in `sim.json`: `flapping-for-0` (the noise misconception) and `missed-by-scrape` (the "sees every
  value" misconception). No `related`: no other simdeck sim teaches monitoring yet.
- Tags: `monitoring`; topic `linux-admin`; level `advanced` (the task's). All exist in `tags.json`. Prometheus is named
  in the explanation only (version of `keep_firing_for`); NLA T36 teaches it (COMMON.md §1). The rule name `HighCPU` is
  data. The instructor caveat CV-40 is not used on the page.

## Deviations from the task

- **`keep-firing` preset: fired 1, resolved 0**, not "1 cycle". With the same flapping metric every true sample resets
  `KeepFiringSince`, so the alert never resolves inside the 15 minutes; the caption at minute 15 says it would resolve
  at 18. Per `alerting.go` the `keep_firing_for` timer runs from the **first false evaluation**, not from the last
  true sample (the task's wording); SPEC.md rule 5.
- **The counter shows fired and resolved** (one notification each way) rather than one cycle count, so the
  `keep-firing` preset reads "1 · 0" and `flapping-for-0` "5 · 5".
- **State without `lastTrueAt`** (in the task's state list): nothing reads it; `keepSince` and `firedAt` are added
  (`alerting.go`'s `KeepFiringSince` and `FiredAt`), and `event` names the step for the caption.
- **`missed-by-scrape` starts at scrape 2 min** (the sim's point); its hint says to try 1 min, which fires at 6.
- **Short labels for the one-screen fit:** the series are `trajna`, `treperava`, `skok 2 min`, `skok 1 min` /
  `sustained`, `flapping`, `spike 2 min`, `spike 1 min` (one row); the preset `missed-by-scrape` is "Neviđeni skok" in
  Croatian (panel height). The legend has no threshold entry (the stage labels it `> 90` on the dashed line), and on
  the Croatian page it names the states with the Croatian word alone (the stage's badges and captions give
  *pending* (na čekanju) and the others with the English term, the term rule); with the glosses the header wrapped.

## Reused model

None: `models/` has nothing for alerting. `sim.js` is pure over plain data (`step`, `valueAt`, `isScrape`,
`resolvesAt`) and promotable as is if a second page (Alertmanager grouping, the task's "possible second page") wants
the same rule states.

## Sources

- Prometheus `rules/alerting.go`, `AlertingRule.Eval` (GitHub main, last change to the file 2026-09-14, read
  2026-10-30): new alerts pending with `ActiveAt = ts`; `ts.Sub(a.ActiveAt) >= r.holdDuration` → firing; missing from
  the result: pending deleted, firing kept while `ts.Sub(a.KeepFiringSince) < r.keepFiringFor` with
  `KeepFiringSince` set at the first missing evaluation and cleared by a result; else inactive.
- Prometheus `docs/configuration/configuration.md`: `scrape_interval` and `evaluation_interval`, `default = 1m`.
- Prometheus `CHANGELOG.md`: 2.42.0 / 2023-01-31, "Add 'keep_firing_for' field to alerting rules. #11827"
  (answers the task's *(check)* on the version).
- NLA `meta/toc.md` T36, T37. NLA `meta/glossary.yaml` has no alerting terms yet *(check when T36–37 are written)*.
- Not checked against a running Prometheus *(check)*: the presets are derived from the source, as the task says.

## Term pairs

None of these are in `kit/glossary.js`; Croatian from the task, written out in both tables:

| en | hr |
|---|---|
| alert | uzbuna |
| alerting rule | pravilo uzbunjivanja |
| scrape | prikupljanje (uzorka) |
| evaluation interval | interval vrednovanja |
| pending | na čekanju |
| firing | aktivna (uzbuna) |
| inactive | neaktivna |
| flapping | treperenje |
| metric | metrika |

## Shared requests

- **Glossary:** add the term pairs above with `"src": "simdeck"`; then the page's `term()` helper can become
  `[[pending]]` / `[[=pending]]`.
- **Kit: a time-axis view** (lanes of per-step cells and a value line on one axis, a now column, future cells), as
  the task anticipated ("kit time-axis view if it exists"). `dns-ttl-cache` draws a similar one by hand.
- **Kit: icons in legend swatches.** The page appends the band's bell to the firing swatch after mount; a swatch
  `icon` field would replace that.

## Checks

- Model numbers printed before the page (every preset and the scrape variations); equal to SPEC.md, pinned in
  `sim.test.js` ("presets").
- `npm run gate -- lnx-alert-states`: pass (manifest, 21 tests, build, 64 browser checks, tokens, scope). Screenshots
  at 1920×1080 light, dark, grayscale and 375×812, hr and en, reviewed, plus six preset states (sustained 8 and 12,
  flapping-for-0 15, keep-firing 15, missed-by-scrape 6, flapping-long-for 3) and sustained at scrape 5, minute 12.
  Fixed from the screenshots: the panel 3–15 px too tall in Croatian (shorter labels, tighter segmented buttons), the
  header's tools wrapped after the legend grew (shorter legend), low value labels on the metric line (now below the dot).
- **Fresh review** (a separate agent read the task, SPEC, model, tests, strings and page against `alerting.go`; no
  model defect). It ran 25 mutations: 22 caught; the three survivors are now handled (a `history.cond` assert, the
  unused `lastTrueAt` dropped from the state, an assert that resolving clears `keepSince`), each re-run to fail.
  Fixed from it: Croatian "nakon 1 minutu" in the reset caption (now "after n true evaluations", which also matches
  the band's count); the counters' plural forms and the English "5 firing" (now "fired"); the legend without the
  metric line, inactive, the bell and the `keep_firing_for` outline; the alert card's "held until minute 18" (now
  "resolves at minute 18"); the YAML putting the global intervals under the rule (now under `global:`); `treperi`
  (verb) as a series name; the term pattern of *flapping* in the explanation; nested parentheses in the resolved
  caption. SPEC.md now says the caption puts the event before the scrape.
- Not checked: a running Prometheus (the presets are derived from the source, as the task says); a projector.

## Time

Start 2026-10-30 16:33, done 16:51 (CET), one session, including the fresh review.
