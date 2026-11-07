<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-nis2-scope: specification

Task `docs/tasks/w3/cmp-nis2-scope.md`, catalogue `cmp-nis2-scope` (§4.13). Class **explorer**: the state is a pure
function of the params (`sim.js` `compute`). The scope rules (size class, scope rows, class, fine ceiling) are
`nis2.js`, pure and promotable to `models/` (`cmp-cost-of-noncompliance` will need the class and the fine ceiling).

**One concept:** NIS2 applies by sector and size: medium and large organisations in the listed sectors are in, large
ones in the high-criticality sectors are essential and the rest important, and some are in whatever their size (DNS
service providers, top-level-domain registries, qualified trust service providers, central government); the class
decides how supervision works (before or after an incident) and the fine ceiling; the national law and the
authorities' lists have the final word.

**The contrast on the stage:** the same organisation on either side of a threshold. One step of staff (249 → 250),
of the balance sheet (€43M → €44M) or one switched-on role moves it to another column or row of the scope table, and
the "what follows" column changes from after-the-fact supervision to supervision before an incident, and the fine
ceiling from €7M / 1.4 % to €10M / 2 %. And the converse: size alone does nothing outside the listed sectors.

## Stage

Three columns, one screen at 1920×1080.

- **The organisation** (left): the sector's name and its group tag (Annex I, Annex II, public administration, not
  listed). Three rulers on a log scale (staff, yearly turnover, balance sheet total), each split into the four size
  zones (micro, small, medium, large) at its own ceilings, a marker at the value and the value written out. Under
  them the **size** box: the size class in bold and the ceiling test written out with ✓ / ✗ per figure ("fewer than
  250 staff ✓, and turnover ≤ €50M ✗ or balance sheet ≤ €43M ✓"), for the size's own ceiling (large: the medium
  ceiling, failed).
- **In scope?** (middle): the scope table: nine rows (rule 2) × four size columns. Each cell holds K / V / – (hr) or
  E / I / – (en) and a pattern (essential solid, important hatched, out blank). Sector rows that apply are in bold with a ✓; role buttons show ✓ when switched on (an idle `named` gets a warning border);
  the organisation's size column is outlined; the deciding cell (rule 4) is ringed thick. The four role rows' headers
  are `aria-pressed` buttons (switch the role). Under the table the **verdict** box: the class word, its icon and the
  reason in words (no article numbers on the stage).
- **What follows** (right): two columns, essential and important, the organisation's class marked (thick border and
  "▼ this organisation"); rows: supervision, obligations (the same for both), the fine ceiling rule, the ceiling for
  this organisation's turnover with which part decides, managers. When out of scope both columns are muted and a
  box says what that means. For a public body the fine row says national law decides whether it is fined, and the
  management row that the temporary ban does not apply (art. 32(5), last subparagraph).
- **Foot:** once: simplified, not legal advice; the organisations and their figures are made up; the national law
  and the authorities' lists have the final word.

The panel holds the presets, the sector drop-down, the three sliders and the explanation; the four role params are
hidden in it (kept for the URL and the reset), because their buttons are on the stage.

## Params

| key | type | default | meaning |
|---|---|---|---|
| `sector` | select (18) | `water` | the organisation's sector (rule 7) |
| `staff` | range 0–12 | 7 (180) | index into the staff ladder (rule 7) |
| `turnover` | range 0–13 | 6 (€30M) | index into the turnover ladder |
| `balance` | range 0–13 | 10 (€70M) | index into the balance sheet ladder |
| `telecom`, `dns`, `qtsp`, `named` | toggle | false | the special roles (rule 2) |

## Rules

1. **Size class** (Recommendation 2003/361/EC, Annex art. 2). Ceilings: micro fewer than 10 staff and turnover or
   balance sheet not above €2M; small fewer than 50 and €10M / €10M; medium fewer than 250 and turnover not above
   €50M or balance sheet not above €43M. An organisation is *within* a ceiling when staff < the headcount **and**
   (turnover ≤ its sum **or** balance sheet ≤ its sum). Its size is the smallest category it is within; large when it
   is within none.
   **Tie-breaks:** staff equal to the headcount is over (249 medium, 250 large: "fewer than"); money equal to the sum is
   within (€50M turnover with €44M balance is medium: "not exceeding"); one money figure within is enough (€62M
   turnover, €38M balance, 120 staff: medium).
2. **Scope rows**, in order, each with its class per size column (micro, small, medium, large) and its source in
   Directive (EU) 2022/2555:

   | row | applies when | micro | small | medium | large | source |
   |---|---|---|---|---|---|---|
   | `annex1` | sector in Annex I (high criticality) | – | – | important | essential | art. 2(1), 3(1)(a), 3(2) |
   | `annex2` | sector in Annex II (other critical) | – | – | important | important | art. 2(1), 3(2) |
   | `central` | central government body | essential | essential | essential | essential | art. 2(2)(f)(i), 3(1)(d) |
   | `local` | local government | – | – | – | – | art. 2(5)(a): only if national law adds it |
   | `unlisted` | sector in neither annex | – | – | – | – | art. 2(1) |
   | `telecom` | role: public electronic communications network or service | important | important | essential | essential | art. 2(2)(a)(i), 3(1)(c) (medium), 3(1)(a) (large, Annex I), 3(2) |
   | `dns` | role: DNS service provider or TLD name registry | essential ×4 | | | | art. 2(2)(a)(iii), 3(1)(b) |
   | `qtsp` | role: qualified trust service provider | essential ×4 | | | | art. 2(2)(a)(ii), 3(1)(b) |
   | `named` | role: identified as essential by the Member State | essential ×4 | | | | art. 2(2)(b)–(e), 3(1)(e) |

   Exactly one sector row applies (the sector's group). A role row applies when its switch is on; `named` only when
   the organisation is of a listed type (group `annex1`, `annex2` or `central`, or `telecom`, `dns` or `qtsp` on):
   the state can name only entities of a type in Annex I or II. `named` switched on for an unlisted type is *idle*.
3. **Size does not matter** for the rows whose four cells are equal (`central`, `dns`, `qtsp`, `named`, and the two
   out-rows): the reading of rule 2.
4. **Class**: the strictest cell over the rows that apply, at the organisation's size column (essential > important >
   out; art. 3(1) lists the essential cases, art. 3(2) makes every other in-scope entity important). **Tie-break:**
   the deciding row is the first row in table order that applies and gives that class; none when out.
5. **Thresholds**: `up` is the nearest larger size column at which the same rows give a stricter class; `down` the
   nearest smaller column with a weaker class; either may be none.
6. **Fine ceiling** (art. 34(4), (5)): essential the higher of €10 000 000 and 2 % of the yearly worldwide turnover,
   important the higher of €7 000 000 and 1.4 %; none when out. The directive sets these as the least maximum national
   law must allow; the page says "at least". **Tie-break:** the share decides only when strictly higher (at exactly
   €500M both are €10M / €7M, and the fixed sum is named). The share is rounded down to whole euros (never needed on
   the ladder: every turnover is a multiple of €100 000).
7. **Ladders**: staff 3, 9, 10, 25, 49, 50, 120, 180, 249, 250, 400, 1 000, 3 000; turnover (€M) 0.5, 2, 2.1, 6, 10,
   10.5, 30, 50, 51, 62, 90, 200, 600, 1 500; balance sheet (€M) 0.5, 2, 2.1, 6, 10, 10.5, 30, 38, 43, 44, 70, 200,
   600, 1 500. Each ceiling has a value on it and one just over it. Sectors (group): energy, transport, health, drinking
   water, cloud or data centre, managed IT or security services (Annex I); postal and courier, waste management, food,
   manufacturing (machinery, electronics, vehicles), chemicals, online marketplace / search / social network, research
   (Annex II); central government body (central); local government (local); retail, custom software development,
   hotels and tourism (unlisted).
8. **Normalise**: an unknown sector is the default; a ladder index is rounded and clamped to the ladder, a non-number
   is the default; a toggle is on only for `true`, `'true'`, `1`, `'1'`.
9. **Caption**: the main sentence names the class and the reason: `cap_<decider>_<class>` when in scope; when out,
   `capOut_small` (a listed sector, under the size cap), `capOut_local` or `capOut_unlisted`. Then one threshold note,
   the first that holds: `nUp<col>` (would become stricter from that column), `nCap` (important, and no size makes it
   essential), `nDown<col>` (would drop below that column), `nAny` (essential at any size), `nNever` (out at any
   size). Then at most one more: `nNamedIdle` (named switched on, but not a listed type) or else `nSeveral` (more than
   one row gives a class at this size; the strictest counts).
10. **Changed marks**: after a change, the size box if the size class changed, the verdict box if the class changed,
    and the row headers whose applies-state changed are highlighted (`.sd-changed`).

## Presets

Made-up organisations; figures illustrative. Checked by the script below and by `sim.test.js`.

| # | id | organisation | sector | staff | turnover | balance | size | class (decider) | note | fine E / I |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `water` | a regional water utility | water (I) | 180 | €30M | €70M | medium | important (annex1) | nUp3 | €10M / €7M fixed |
| 2 | `msp` | a managed IT services firm | msp (I) | 120 | €62M | €38M | medium | important (annex1) | nUp3 | €10M / €7M fixed |
| 3 | `machines` | a machinery maker | manufacturing (II) | 400 | €600M | €200M | large | important (annex2) | nCap | €12M / €8.4M share |
| 4 | `shop` | a retail chain | retail (–) | 1 000 | €200M | €200M | large | out (unlisted) | nNever | – |
| 5 | `dns` | a nine-person software firm that runs DNS for its clients | software (–) + dns | 9 | €2M | €0.5M | micro | essential (dns) | nAny | €10M / €7M fixed |
| 6 | `agency` | a small central government agency | central | 49 | €6M | €6M | small | essential (central) | nAny | public body |

What the student does with them: water → staff 250: essential. msp → balance €44M: large, essential (turnover was
already over €50M; one figure under the ceiling kept it medium). machines → sector energy: essential; any size down to
50 staff stays important. shop → switch on `dns`: essential; any size, still out without a role. dns → switch the role
off: micro and unlisted, out. agency → sector water at the same size: out (small).

## Check script

```js
// node sims/cmp-nis2-scope/check-spec.js (not kept; run from the scratchpad on 2026-11-07)
const L = require('./sim.js');
for (const x of L.presets) { const s = L.compute(x.params); console.log(x.id, s.sizeId, s.cls, s.decider, L.captionKey(s).notes, s.fines.essential, s.fines.important); }
```

Output (abridged): `water medium important annex1 [nUp3] 10M fixed / 7M fixed`; `msp medium important annex1 [nUp3]`;
`machines large important annex2 [nCap] 12M pct / 8.4M pct`; `shop large out null [nNever]`; `dns micro essential dns
[nAny]`; `agency small essential central [nAny]`. Every one of the 18 sectors × 13 staff × 6 turnover × 6 balance × 16
role combinations was run: reachable main keys are the 12 listed in `strings.js`; reachable notes `nUp2 nUp3 nCap
nDown1 nDown2 nAny nNever nNamedIdle nSeveral` (no `nUp1`, `nDown0`: micro and small give the same class in every
row).

## Legend

K / E solid cell (essential), V / I hatched cell (important), – blank (out of scope), thick ring (the deciding cell),
outlined column (this organisation's size).

## Terms

Croatian from the official Croatian text of the directive where known (ključni subjekt, važni subjekt, sektori visoke
kritičnosti, ostali kritični sektori, nadležno tijelo) and of the Recommendation (broj zaposlenih, godišnji promet,
ukupna godišnja bilanca, mikro, malo i srednje poduzeće); every other choice is listed in `NOTES.md` under "Term pairs".

## Misconceptions targeted

- "We are big, so NIS2 applies": not outside the listed sectors (shop).
- "We are small, so it doesn't": not for DNS, TLD registries, qualified trust services, central government (dns, agency).
- "Over €50M turnover is large": only with the balance sheet over €43M too, or 250 staff (msp).
- "Important means lighter obligations": the measures and the reporting are the same; supervision and fines differ.
- "We decide our class ourselves": the state can name an entity essential and keeps the list (art. 3(3)).

## Out of scope

Partner and linked enterprises (a group's figures are added, Recommendation Annex art. 3 and 6), the two-year rule for
a change of size (Annex art. 4(2)), non-qualified trust service providers (in at any size, essential only when large),
regional government (in after a national risk assessment), critical entities under Directive (EU) 2022/2557 (merged
into `named`), financial entities under DORA (art. 4: sector-specific law prevails), which national authority
supervises which sector, and the Croatian fine amounts. Each is named in the explanation or `NOTES.md`.
