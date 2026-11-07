/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of fin-contingency-reserve, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   The title and subtitle come from sim.json. Numbers are formatted in the page (index.html) and passed in. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Stavke procjene kao rasponi, ishodi mnogo pokusa i proračun za svaku razinu pouzdanosti',
      line: 'Stavka',
      conf: 'Razina pouzdanosti',
      trials: 'Broj pokusa',
      runAgain: 'Novi pokusi',
      line_hw: 'Oprema',
      line_staff: 'Rad vlastitih djelatnika',
      line_ext: 'Vanjski izvođači',
      line_mig: 'Migracija podataka',
      line_train: 'Obuka i primopredaja',
      mlOf: '{line}: najvjerojatnije',
      downOf: '{line}: može biti manje za',
      upOf: '{line}: može biti više za',
      pq: 'P{q}',
      headLines: 'Stavke procjene: od najniže preko najvjerojatnije do najviše vrijednosti',
      lineNums: '{lo} – {hi}',
      lineMl: 'najvjerojatnije {ml}, prosjek {m}',
      lineLabel: '{line}: od {lo} do {hi}, najvjerojatnije {ml}',
      sumRow: 'Zbroj najvjerojatnijih: {base}; zbroj prosjeka: {m}',
      headTrials: 'Ukupni trošak u {n}',
      nTrials: ['{n} pokusu', '{n} pokusa', '{n} pokusa'],
      tagBase: 'zbroj najvjerojatnijih {v}',
      tagLevel: '{p} {v}',
      bracket: 'pričuva {v}',
      axisShare: 'udio pokusa',
      headLadder: 'Pouzdanost → proračun i pričuva',
      ladderRes: '+{r} ({pct})',
      ladderCovered: 'bez pričuve',
      ladderLabel: '{p}: proračun {b}',
      resultReserve: '{p}: proračun {b} = zbroj najvjerojatnijih {base} + pričuva {r} ({pct})',
      resultCovered: '{p}: proračun {b}; zbroj najvjerojatnijih {base} već je dovoljan, pričuva nije potrebna',
      foot: 'Svaka je stavka trokutasti raspon, a stavke su neovisne. Sve na najnižem: {low}; sve na najvišem: {high}.',
      illustrative: 'Iznosi su izmišljeni, ali uvjerljivi.',
      eur: '{n} €',
      pct: '{n} %',
      share: '{n} %',
      pProject: 'Projekt',
      pProjectHint: 'Pet stavki koje mogu više premašiti nego uštedjeti: zbroj najvjerojatnijih dovoljan je u 1,5 % pokusa.',
      pSymmetric: 'Simetrično',
      pSymmetricHint: 'Iste stavke, svaka ±15 %: zbroj najvjerojatnijih je medijan, a pričuva plaća samo raspršenost.',
      pOneWild: 'Rizična stavka',
      pOneWildHint: 'Migracija podataka može ispasti i tri puta skuplja: ta stavka nosi najveći dio pričuve.',
      pFewTrials: 'Malo pokusa',
      pFewTrialsHint: 'Samo 100 pokusa: pritisni Novi pokusi (N) i gledaj kako P80 skače.',
      pSpendCap: 'Gornja granica',
      pSpendCapHint: 'Mali projekt s gornjom granicom jednokratnog troška od 15 000 €: stane li i P95?',
      legIn: 'u zbroju najvjerojatnijih',
      legRes: 'pokriva pričuva',
      legOver: 'iznad proračuna',
      legBase: 'zbroj najvjerojatnijih',
      legLevel: 'proračun na odabranoj razini',
      legCurve: 'udio pokusa do tog iznosa',
      legMl: 'najvjerojatnije',
      legMean: 'prosjek stavke',
      legChanged: 'pričuva je postala potrebna ili nepotrebna',
      capReserve: 'Najvjerojatnije vrijednosti daju zbroj {base}, a on je bio dovoljan u samo {e} pokusa. Otprilike ' +
        'polovica pokusa koštala je više od {p50} (P50). Za pouzdanost od {q} proračun je {b}: pričuva {r}, {pct} zbroja.',
      capCovered: 'Najvjerojatnije vrijednosti daju zbroj {base}, dovoljan u {e} pokusa; P50 je {p50}. Uz pouzdanost ' +
        'od {q} proračun {b} nije veći od zbroja: pričuva nije potrebna.',
      nSkew: 'Zajedno stavke mogu više premašiti nego uštedjeti, pa je zbroj njihovih prosjeka, {m}, iznad zbroja ' +
        'najvjerojatnijih vrijednosti i blizu P50.',
      nSymmetric: 'Svi su rasponi simetrični: zbroj najvjerojatnijih je medijan, a pričuva kupuje samo raspršenost iznad njega.',
      nFew: 'Uz samo {n} pokusa razine se mijenjaju sa svakim pokretanjem: pritisni Novi pokusi.',
      explain: '<p>Svaka se stavka projekta procjenjuje <b>u tri točke</b> (engl. <i lang="en">three-point estimate</i>): ' +
        'najniža, <b>najvjerojatnija</b> i najviša vrijednost. Rasponi su obično <b>nagnuti prema prekoračenju</b>: ' +
        'posao rijetko ispadne mnogo jeftiniji, a može ispasti mnogo skuplji. Zato je <b>prosjek</b> svake stavke iznad ' +
        'njezine najvjerojatnije vrijednosti.</p>' +
        '<p>Plan složen od najvjerojatnijih vrijednosti zato je optimističan. <b>Simulacija Monte Carlo</b> izvlači ' +
        'svaku stavku iz njezina raspona tisućama puta i zbraja ih. Medijan ukupnog troška, <b>P50</b>, leži blizu ' +
        'zbroja prosjeka, iznad zbroja najvjerojatnijih. <b>P80</b> je iznos koji je bio dovoljan u 80 % pokusa; ' +
        'to ne znači 80 % troška.</p>' +
        '<p><b>Pričuva za nepredviđene troškove</b> (engl. <i lang="en">contingency reserve</i>) je razlika između ' +
        'proračuna na odabranoj razini pouzdanosti i zbroja najvjerojatnijih vrijednosti. Ona kupuje pouzdanost: ' +
        'svaki sljedeći postotak pouzdanosti košta više od prethodnog, a proračun za najgori slučaj (sve na najvišem) ' +
        'bio bi daleko iznad i P95. Više pokusa ne pojeftinjuje projekt; samo daje mirniju procjenu razine.</p>' +
        '<p>Ovdje su stavke neovisne. Kad rizici idu zajedno (isti dobavljač, isti tim), rep se produljuje i ' +
        'pričuva raste. Pričuva uprave (engl. <i lang="en">management reserve</i>) za posve nepredviđeno je izvan ' +
        'ovog modela.</p>'
    },
    en: {
      stage: 'The lines of the estimate as ranges, the totals of many trials and the budget at each confidence level',
      line: 'Line',
      conf: 'Confidence level',
      trials: 'Trials',
      runAgain: 'Run again',
      line_hw: 'Hardware',
      line_staff: 'Own staff time',
      line_ext: 'Contractors',
      line_mig: 'Data migration',
      line_train: 'Training and handover',
      mlOf: '{line}: most likely',
      downOf: '{line}: may come in lower by',
      upOf: '{line}: may run higher by',
      pq: 'P{q}',
      headLines: 'The lines of the estimate: from the lowest through the most likely to the highest value',
      lineNums: '{lo} – {hi}',
      lineMl: 'most likely {ml}, average {m}',
      lineLabel: '{line}: {lo} to {hi}, most likely {ml}',
      sumRow: 'Sum of the most likely values: {base}; sum of the averages: {m}',
      headTrials: 'The total in {n}',
      nTrials: ['{n} trial', '{n} trials'],
      tagBase: 'sum of most likely values {v}',
      tagLevel: '{p} {v}',
      bracket: 'reserve {v}',
      axisShare: 'share of trials',
      headLadder: 'Confidence → budget and reserve',
      ladderRes: '+{r} ({pct})',
      ladderCovered: 'no reserve',
      ladderLabel: '{p}: budget {b}',
      resultReserve: '{p}: budget {b} = sum of most likely values {base} + reserve {r} ({pct})',
      resultCovered: '{p}: budget {b}; the sum of the most likely values, {base}, is already enough: no reserve needed',
      foot: 'Each line is a triangular range, and the lines are independent. Everything at its lowest: {low}; ' +
        'everything at its highest: {high}.',
      illustrative: 'The amounts are made up but plausible.',
      eur: '€{n}',
      pct: '{n}%',
      share: '{n}%',
      pProject: 'Project',
      pProjectHint: 'Five lines that can overrun more than they can save: the sum of the most likely values is enough in 1.5% of the trials.',
      pSymmetric: 'Symmetric',
      pSymmetricHint: 'The same lines, each ±15%: the sum of the most likely values is the median, and a reserve pays only for the spread.',
      pOneWild: 'One risky line',
      pOneWildHint: 'Data migration may cost up to three times its most likely value: that line carries most of the reserve.',
      pFewTrials: 'Few trials',
      pFewTrialsHint: 'Only 100 trials: press Run again (N) and watch P80 jump.',
      pSpendCap: 'Spend cap',
      pSpendCapHint: 'A small project under a one-off spend cap of €15,000: does even P95 fit?',
      legIn: 'within the sum',
      legRes: 'covered by the reserve',
      legOver: 'over the budget',
      legBase: 'sum of the most likely values',
      legLevel: 'budget at the chosen level',
      legCurve: 'share of trials up to it',
      legMl: 'most likely',
      legMean: 'line average',
      legChanged: 'need for a reserve changed',
      capReserve: 'The most likely values add up to {base}, and that was enough in only {e} of the trials. About half ' +
        'the trials cost more than {p50} (P50). For {q} confidence the budget is {b}: a reserve of {r}, {pct} of the sum.',
      capCovered: 'The most likely values add up to {base}, enough in {e} of the trials; P50 is {p50}. At {q} ' +
        'confidence the budget {b} is no more than the sum: no reserve is needed.',
      nSkew: 'Taken together, the lines can overrun further than they can save, so the sum of their averages, {m}, lies ' +
        'above the sum of the most likely values and close to P50.',
      nSymmetric: 'Every range is symmetric: the sum of the most likely values is the median, and a reserve buys only the spread above it.',
      nFew: 'With only {n} trials the levels move with every run: press Run again.',
      explain: '<p>Each line of a project is estimated at <b>three points</b> (a <i>three-point estimate</i>): the ' +
        'lowest, the <b>most likely</b> and the highest value. The ranges are usually <b>skewed towards overruns</b>: ' +
        'work seldom turns out much cheaper, but it can turn out much dearer. So the <b>average</b> of each line lies ' +
        'above its most likely value.</p>' +
        '<p>A plan built from the most likely values is therefore optimistic. A <b>Monte Carlo simulation</b> draws ' +
        'each line from its range thousands of times and adds them up. The median total, <b>P50</b>, lies near the ' +
        'sum of the averages, above the sum of the most likely values. <b>P80</b> is the amount that was enough in 80% ' +
        'of the trials; it does not mean 80% of the cost.</p>' +
        '<p>The <b>contingency reserve</b> is the difference between the budget at the chosen confidence level and the ' +
        'sum of the most likely values. It buys confidence: each further point of confidence costs more than the one ' +
        'before, and a budget for the worst case (everything at its highest) would be far above even P95. More trials ' +
        'do not make the project cheaper; they only make the estimate of the level steadier.</p>' +
        '<p>Here the lines are independent. When risks move together (the same supplier, the same team), the tail ' +
        'grows longer and the reserve with it. A <i>management reserve</i> for the entirely unforeseen is outside ' +
        'this model.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
