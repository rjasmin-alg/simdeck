/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the page, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural forms
   (hr: 1 / 2–4 / 5+, en: 1 / other). The title and subtitle are not here: they come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Najviša kazna prema prometu i očekivani godišnji trošak bez mjera i s njima',

      eur: '{n} €',
      kEur: '{n} tis. €',
      mEur: '{n} mil. €',
      bEur: '{n} mlrd. €',

      law_gdpr: 'GDPR',
      law_ess: 'NIS2, ključni subjekt',
      law_imp: 'NIS2, važni subjekt',
      lawShort_gdpr: 'GDPR',
      lawShort_ess: 'NIS2 ključni',
      lawShort_imp: 'NIS2 važni',

      // the chart
      headCeiling: 'Najviša kazna prema svjetskom godišnjem prometu',
      chartLabel: 'Graf: najviša kazna je veće od fiksnog iznosa {f} i {r} prometa; za promet {t} iznosi {c}',
      lnFixed: 'fiksni iznos',
      lnPct: '{r} prometa',
      lnTurn: 'cijeli promet',
      lnCross: 'prijelaz',
      axTurn: 'promet →',

      // the comparison across regimes
      headCmp: 'Isti promet ({t}), kazna {k} najviše',
      cmpLaw: 'Propis',
      cmpFixed: 'Fiksni iznos',
      cmpPct: 'Postotak prometa',
      cmpCeil: 'Najviša kazna',
      cmpFine: 'Kazna',
      dFixed: 'fiksni',
      dPct: 'postotak',
      dEqual: 'jednako',

      // the costs
      headCost: 'Očekivani trošak godišnje',
      rowWithout: 'Bez mjera',
      rowWith: 'S mjerama',
      segInc: 'incidenti',
      segFine: 'kazne',
      segSpend: 'cijena mjera',
      formula0: '{p} × ({i} + {q} × {f}) = {e}',
      formula1: '{p} × ({i} + {q} × {f}) + {s} = {e}',
      vWorth: 'Mjere uklanjaju {x} godišnje, a stoje {s}: isplate se za {n}.',
      vEven: 'Mjere uklanjaju {x} godišnje, a stoje {s}: točno se isplate.',
      vNot: 'Mjere uklanjaju {x} godišnje, a stoje {s}: skuplje su za {n}.',

      // who answers
      headWho: 'Tko odgovara',
      who_gdpr: 'Voditelj obrade mora provesti primjerene mjere i dokazati ih (čl. 24. i 32. GDPR-a); kaznu izriče nadzorno tijelo.',
      who_ess: 'Upravljačko tijelo odobrava i nadzire mjere i može odgovarati za povredu (čl. 20. NIS2); ako ranije mjere ne uspiju, glavnom direktoru može se privremeno zabraniti upravljačka funkcija (čl. 32. st. 5.).',
      who_imp: 'Upravljačko tijelo odobrava mjere, nadzire ih i može odgovarati za povredu (čl. 20. NIS2); članovi uprave moraju proći osposobljavanje.',

      // params, presets, legend
      turn: 'Svjetski godišnji promet',
      law: 'Propis; NIS2 razred subjekta',
      p: 'Vjerojatnost incidenta godišnje',
      inc: 'Trošak jednog incidenta',
      q: 'Vjerojatnost kazne nakon incidenta, bez mjera',
      k: 'Kazna kao udio najviše',
      headAsm: 'Pretpostavke',
      spend: 'Cijena mjera godišnje',
      eff: 'Udio incidenata koje mjere sprječavaju',
      lawBtn_gdpr: 'GDPR',
      lawBtn_ess: 'Ključni',
      lawBtn_imp: 'Važni',
      pSmallFixed: 'Mala tvrtka: odlučuje fiksni iznos',
      pSmallFixedHint: 'Promet 10 mil. €, važni subjekt: najviša kazna 7 mil. €, 70 % prometa; većina očekivanog troška je kazna.',
      pLargePct: 'Velika grupa: odlučuje postotak',
      pLargePctHint: 'Promet 2,5 mlrd. €, GDPR: 4 % je 100 mil. €, pet puta više od fiksnog iznosa.',
      pCrossover: 'Prijelaz na 500 mil. €',
      pCrossoverHint: 'Ključni subjekt s prometom 500 mil. €: 2 % je točno 10 mil. €.',
      pTinyFirm: 'Mikrotvrtka: mjere se ne isplate',
      pTinyFirmHint: 'Promet 2 mil. €, rijetki incidenti: mjere stoje više nego što prosječno uklone.',
      pBreakEven: 'Točno se isplati',
      pBreakEvenHint: 'GDPR, promet 50 mil. €: mjere uklanjaju točno onoliko koliko stoje.',
      legCeil: 'najviša kazna',
      legFixed: 'fiksni iznos',
      legPct: 'postotak prometa',
      legTurn: 'cijeli promet',
      legFirm: 'tvrtka',
      legInc: 'incidenti',
      legFine: 'kazne',
      legSpend: 'cijena mjera',

      // the caption
      capFixed: 'Najviša kazna je veće od {F} i {r} prometa od {T} ({P}): odlučuje fiksni iznos, {C}, što je {s} godišnjeg prometa.',
      capPct: 'Najviša kazna je veće od {F} i {r} prometa od {T} ({P}): odlučuje postotak, {C}, što je {s} godišnjeg prometa.',
      capEqual: 'Pri prometu od {T} udio od {r} jednak je fiksnom iznosu, {C}: ispod te granice odlučuje fiksni iznos, iznad nje postotak.',
      capWorth: 'Bez mjera očekivano {e0} godišnje; s mjerama {e1} + cijena {s} = {t1}: mjere se isplate za {n}.',
      capEven: 'Bez mjera očekivano {e0} godišnje; s mjerama {e1} + cijena {s} = {t1}: mjere se točno isplate.',
      capNot: 'Bez mjera očekivano {e0} godišnje; s mjerama {e1} + cijena {s} = {t1}: mjere su u prosjeku skuplje za {n}.',
      nDutyNis2: 'Mjere iz čl. 21. NIS2 ipak su obveza, a za njih odgovara upravljačko tijelo: usporedba pokazuje cijenu, ne izbor.',
      nDutyGdpr: 'Primjerene mjere ipak su obveza voditelja obrade (čl. 32. GDPR-a): usporedba pokazuje cijenu, ne izbor.',
      nOverTurnover: 'Najviša kazna veća je od cijelog godišnjeg prometa: za malu tvrtku fiksni iznos nije mala brojka.',
      nFine: 'Većina očekivanog troška bez mjera je kazna, ne sam incident: kazna se izriče uglavnom zbog mjera koje nedostaju (ili zakašnjele prijave).',

      foot: 'Pojednostavljeno, nije pravni savjet. Osim najviših kazni iz propisa, svi su iznosi i vjerojatnosti izmišljeni.',

      explain:
        '<p><b>Najviša kazna</b> nije jedan broj nego <b>veće od dvaju</b>: fiksnog iznosa i postotka ' +
        '<b>ukupnog godišnjeg prometa na svjetskoj razini</b> (<i lang="en">total worldwide annual turnover</i>) ' +
        'za prethodnu financijsku godinu, i to cijelog poduzetnika, ne samo jednog društva u grupi.</p>' +
        '<ul>' +
        '<li><b>GDPR</b> (Opća uredba o zaštiti podataka), čl. 83. st. 5.: do 20 milijuna € ili 4 %; za lakše ' +
        'povrede, st. 4.: do 10 milijuna € ili 2 %.</li>' +
        '<li><b>NIS2</b> (Direktiva (EU) 2022/2555), čl. 34. st. 4. i 5.: najviša kazna mora biti <b>barem</b> ' +
        '10 milijuna € ili 2 % za <b>ključne subjekte</b> i 7 milijuna € ili 1,4 % za <b>važne subjekte</b>. ' +
        'U Hrvatskoj NIS2 provodi Zakon o kibernetičkoj sigurnosti (NN 14/2024), koji propisuje svoje iznose; ' +
        'subjekte razvrstavaju nadležna tijela, ne subjekti sami.</li>' +
        '<li>Za sva tri slučaja prijelaz je na <b>500 milijuna €</b> prometa: ispod odlučuje fiksni iznos, ' +
        'iznad postotak. Za malu tvrtku fiksni iznos može biti veći od cijelog prometa.</li>' +
        '</ul>' +
        '<p>Najviša kazna je gornja granica. Stvarnu kaznu tijelo određuje od slučaja do slučaja i mora biti ' +
        'razmjerna (čl. 83. st. 1. i 2. GDPR-a, čl. 34. st. 1. NIS2): zato se ovdje bira kazna kao udio najviše.</p>' +
        '<p><b>Očekivani godišnji trošak</b> = vjerojatnost incidenta × (trošak incidenta + vjerojatnost kazne × ' +
        'kazna), isti model očekivanog gubitka kao u simulatoru o godišnjem očekivanom gubitku. Mjere smanjuju ' +
        'vjerojatnost incidenta, a jer se kazna izriče uglavnom zbog <b>mjera koje nedostaju</b> (čl. 32. GDPR-a, čl. 21. ' +
        'NIS2; uz to i zbog zakašnjele prijave, čl. 33. GDPR-a, čl. 23. NIS2), uz provedene i dokumentirane mjere incident ovdje četiri puta rjeđe završi kaznom. Mjere se isplate ' +
        'kad uklone više nego što stoje; jednako je točno na nuli.</p>' +
        '<p>Prosjek skriva rijetku lošu godinu, a mjere su zakonska obveza: ni mjere koje se „ne isplate” nisu ' +
        'izbor. Prema NIS2 <b>upravljačko tijelo</b> (<i lang="en">management body</i>) odobrava mjere, nadzire ' +
        'njihovu provedbu i može odgovarati za povrede (čl. 20.); ako ranije mjere nadzora ne uspiju, ključnom subjektu ' +
        'može se privremeno zabraniti obavljanje upravljačkih funkcija osobi na razini glavnog direktora (čl. 32. st. 5.).</p>' +
        '<p>Tvrtka, vjerojatnosti, troškovi incidenata, cijene i učinak mjera su izmišljeni; najviše kazne su iz ' +
        'propisa. Pojednostavljeno, nije pravni savjet.</p>'
    },

    en: {
      stage: 'The fine ceiling by turnover and the expected yearly cost without and with the measures',

      eur: '€{n}',
      kEur: '€{n}k',
      mEur: '€{n}M',
      bEur: '€{n}bn',

      law_gdpr: 'GDPR',
      law_ess: 'NIS2, essential entity',
      law_imp: 'NIS2, important entity',
      lawShort_gdpr: 'GDPR',
      lawShort_ess: 'NIS2 essential',
      lawShort_imp: 'NIS2 important',

      // the chart
      headCeiling: 'The fine ceiling by worldwide yearly turnover',
      chartLabel: 'Chart: the fine ceiling is the higher of the fixed sum {f} and {r} of turnover; at a turnover of {t} it is {c}',
      lnFixed: 'fixed sum',
      lnPct: '{r} of turnover',
      lnTurn: 'whole turnover',
      lnCross: 'crossover',
      axTurn: 'turnover →',

      // the comparison across regimes
      headCmp: 'Same turnover ({t}), fine at {k} of the ceiling',
      cmpLaw: 'Regime',
      cmpFixed: 'Fixed sum',
      cmpPct: 'Share of turnover',
      cmpCeil: 'Ceiling',
      cmpFine: 'Fine',
      dFixed: 'fixed',
      dPct: 'percentage',
      dEqual: 'equal',

      // the costs
      headCost: 'Expected cost per year',
      rowWithout: 'Without the measures',
      rowWith: 'With the measures',
      segInc: 'incidents',
      segFine: 'fines',
      segSpend: 'price of the measures',
      formula0: '{p} × ({i} + {q} × {f}) = {e}',
      formula1: '{p} × ({i} + {q} × {f}) + {s} = {e}',
      vWorth: 'The measures remove {x} a year and cost {s}: they pay for themselves with {n} to spare.',
      vEven: 'The measures remove {x} a year and cost {s}: they exactly pay for themselves.',
      vNot: 'The measures remove {x} a year and cost {s}: they cost {n} more.',

      // who answers
      headWho: 'Who answers',
      who_gdpr: 'The controller must take appropriate measures and be able to show them (GDPR art. 24 and 32); the supervisory authority sets the fine.',
      who_ess: 'The management body approves and oversees the measures and can be held liable (NIS2 art. 20); as a last resort a chief executive can be temporarily barred from managerial functions (art. 32(5)).',
      who_imp: 'The management body approves the measures, oversees them and can be held liable for infringements (NIS2 art. 20); its members must take training.',

      // params, presets, legend
      turn: 'Worldwide yearly turnover',
      law: 'Regime; NIS2 entity class',
      p: 'Incident likelihood per year',
      inc: 'Cost of one incident',
      q: 'Chance of a fine, without the measures',
      k: 'Fine as a share of the ceiling',
      headAsm: 'Assumptions',
      spend: 'Price of the measures per year',
      eff: 'Incidents the measures prevent',
      lawBtn_gdpr: 'GDPR',
      lawBtn_ess: 'Essential',
      lawBtn_imp: 'Important',
      pSmallFixed: 'Small firm: the fixed sum decides',
      pSmallFixedHint: 'Turnover €10M, important entity: the ceiling is €7M, 70 % of turnover; most of the expected cost is the fine.',
      pLargePct: 'Large group: the percentage decides',
      pLargePctHint: 'Turnover €2.5bn, GDPR: 4 % is €100M, five times the fixed sum.',
      pCrossover: 'The crossover at €500M',
      pCrossoverHint: 'An essential entity with €500M turnover: 2 % is exactly €10M.',
      pTinyFirm: 'Micro firm: the measures do not pay',
      pTinyFirmHint: 'Turnover €2M, rare incidents: the measures cost more than they remove on average.',
      pBreakEven: 'Exactly pays for itself',
      pBreakEvenHint: 'GDPR, turnover €50M: the measures remove exactly what they cost.',
      legCeil: 'fine ceiling',
      legFixed: 'fixed sum',
      legPct: 'share of turnover',
      legTurn: 'whole turnover',
      legFirm: 'the firm',
      legInc: 'incidents',
      legFine: 'fines',
      legSpend: 'price of the measures',

      // the caption
      capFixed: 'The ceiling is the higher of {F} and {r} of a {T} turnover ({P}): the fixed sum decides, {C}, which is {s} of the yearly turnover.',
      capPct: 'The ceiling is the higher of {F} and {r} of a {T} turnover ({P}): the percentage decides, {C}, which is {s} of the yearly turnover.',
      capEqual: 'At a turnover of {T}, {r} of turnover equals the fixed sum, {C}: below it the fixed sum decides, above it the percentage.',
      capWorth: 'Without the measures {e0} a year expected; with them {e1} + their price {s} = {t1}: they pay off by {n}.',
      capEven: 'Without the measures {e0} a year expected; with them {e1} + their price {s} = {t1}: they exactly pay for themselves.',
      capNot: 'Without the measures {e0} a year expected; with them {e1} + their price {s} = {t1}: on average they cost {n} more.',
      nDutyNis2: 'The measures of NIS2 art. 21 are a duty anyway, and the management body answers for them: the comparison shows a price, not a choice.',
      nDutyGdpr: 'Appropriate measures are the controller\'s duty anyway (GDPR art. 32): the comparison shows a price, not a choice.',
      nOverTurnover: 'The ceiling is more than the whole yearly turnover: for a small firm the fixed sum is not a small number.',
      nFine: 'Most of the expected cost without the measures is the fine, not the incident itself: the fine is mainly for the missing measures (or late reporting).',

      foot: 'Simplified, not legal advice. Except the legal fine ceilings, every amount and likelihood is made up.',

      explain:
        '<p>The <b>fine ceiling</b> is not one number but <b>the higher of two</b>: a fixed sum and a share of the ' +
        '<b>total worldwide annual turnover</b> of the preceding financial year, of the whole undertaking, not just ' +
        'one company in the group.</p>' +
        '<ul>' +
        '<li><b>GDPR</b>, art. 83(5): up to €20 million or 4 %; for lesser infringements, art. 83(4): up to ' +
        '€10 million or 2 %.</li>' +
        '<li><b>NIS2</b> (Directive (EU) 2022/2555), art. 34(4) and (5): the ceiling must be <b>at least</b> ' +
        '€10 million or 2 % for <b>essential entities</b> and €7 million or 1.4 % for <b>important entities</b>. ' +
        'In Croatia NIS2 is implemented by the Zakon o kibernetičkoj sigurnosti (NN 14/2024), which sets its own ' +
        'amounts; the competent authorities categorise the entities, the entities do not decide for themselves.</li>' +
        '<li>In all three the crossover is at a turnover of <b>€500 million</b>: below it the fixed sum decides, ' +
        'above it the percentage. For a small firm the fixed sum can exceed its whole turnover.</li>' +
        '</ul>' +
        '<p>The ceiling is an upper bound. The authority sets the actual fine case by case, and it must be ' +
        'proportionate (GDPR art. 83(1)–(2), NIS2 art. 34(1)): hence the fine as a share of the ceiling here.</p>' +
        '<p><b>Expected yearly cost</b> = incident likelihood × (incident cost + chance of a fine × fine), the same ' +
        'expected-loss model as the annualised loss expectancy simulator. The measures cut the likelihood of an ' +
        'incident, and because the fine is mainly for the <b>missing measures</b> (GDPR art. 32, NIS2 art. 21; also for late ' +
        'reporting, GDPR art. 33, NIS2 art. 23), with ' +
        'measures in place and documented an incident here ends in a fine a quarter as often. The measures pay ' +
        'when they remove more than they cost; equal is exactly break-even.</p>' +
        '<p>The average hides the rare bad year, and the measures are a legal duty: even measures that "do not ' +
        'pay" are not optional. Under NIS2 the <b>management body</b> approves the measures, oversees their ' +
        'implementation and can be held liable for infringements (art. 20); for an essential entity, when earlier ' +
        'enforcement has failed, a person at chief-executive level can be temporarily barred from managerial functions (art. 32(5)).</p>' +
        '<p>The firm, the likelihoods, incident costs, prices and the effect of the measures are made up; the ' +
        'ceilings come from the law. Simplified, not legal advice.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
