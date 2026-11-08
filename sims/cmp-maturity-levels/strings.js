/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the page, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural forms
   (hr: 1 / 2–4 / 5+, en: 1 / other). The title and subtitle are not here: they come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Osam područja kontrola: sadašnje i ciljne razine zrelosti, trošak, nalazi revizije i incidenti',

      area1: 'Popis imovine',
      area2: 'Upravljanje pristupom',
      area3: 'Ranjivosti i zakrpe',
      area4: 'Sigurnosne kopije',
      area5: 'Zapisi i nadzor',
      area6: 'Odgovor na incidente',
      area7: 'Dobavljači',
      area8: 'Svijest i obuka',
      lv1: 'ad hoc',
      lv2: 'ponovljivo',
      lv3: 'definirano',
      lv4: 'mjereno',
      lv5: 'stalno se poboljšava',

      // the radar
      headRadar: 'Razine po područjima',
      radarLabel: 'Mreža osam područja: prosjek cilja {a}, najslabije je {w} na razini {l}',
      weeks: ['{n} tjedan', '{n} tjedna', '{n} tjedana'],
      budgetUse: 'Plan: {k} od {b}',
      budgetLeft: 'ostalo {x}',
      budgetOver: 'preko proračuna za {x}',

      // the table
      headTable: 'Ocijeni sadašnju razinu i postavi cilj (− i +)',
      colArea: 'Područje',
      colNow: 'Sada',
      colPlan: 'Cilj',
      colWeeks: 'Tjedni',
      colAudit: 'Revizija (cilj)',
      colInc: 'Incidenti godišnje (cilj)',
      fMajor: 'velika',
      fMinor: 'mala',
      fNone: 'bez nalaza',
      bCurDown: '{w}: sadašnja razina niže',
      bCurUp: '{w}: sadašnja razina više',
      bTgtDown: '{w}: cilj niže',
      bTgtUp: '{w}: cilj više',

      // the comparison
      headCmp: 'Isti proračun ({b}), četiri plana',
      cmpPlan: 'Plan',
      cmpCost: 'Trošak',
      cmpAvg: 'Prosjek',
      cmpWeak: 'Najslabije područje',
      cmpAudit: 'Nesukladnosti',
      cmpInc: 'Incidenti godišnje',
      plan_now: 'Sada, bez plana',
      plan_plus1: 'Sva područja +1',
      plan_floor: 'Sva područja barem 3',
      plan_yours: 'Tvoj plan',
      fits: 'stane',
      overBy: 'preko za {x}',
      shareOf: '{s} iz najslabijeg',

      // params, presets, legend
      budget: 'Proračun',
      budgetOpt: '{n} tj.',
      clear: 'Poništi plan',
      pAverageFine: 'Prosjek izgleda dobro',
      pAverageFineHint: 'Prosjek 3,25, a zapisi i nadzor su na razini 1.',
      pPlusOne: 'Sva područja razinu više',
      pPlusOneHint: 'Svako područje +1: 90 tjedana, a najslabije ostaje najslabije.',
      pFloor: 'Najslabije na definirano',
      pFloorHint: 'Samo zapisi i nadzor s 1 na 3: 6 tjedana.',
      pPerArea: 'Cilj po području',
      pPerAreaHint: 'Najslabije na 3, dva važna na 4: 22 od 24 tjedna.',
      pShowcase: 'Izlog i rupa',
      pShowcaseHint: 'Prosjek 3,75, a dobavljači su na razini 1.',
      pShowcaseFloor: 'Izlog: popuni rupe',
      pShowcaseFloorHint: 'Dobavljači i zapisi na 3 uz proračun od 12 tjedana.',
      legNow: 'sada',
      legPlan: 'cilj',
      legAvg: 'prosjek cilja',
      legLine: 'crta revizije (3)',
      legWeak: 'najslabije',
      legMajor: 'velika nesukladnost',
      legMinor: 'mala nesukladnost',

      // the caption
      capNow: 'Prosjek je {a}, ali područje „{w}” je na razini {l}. Nesukladnosti u reviziji: velikih {M}, malih {m}; iz najslabijeg područja dolazi {s} očekivanih incidenata.',
      capPlan: 'Plan za {k} od {b}: prosjek {a0} → {a1}, najslabije {l0} → {l1} („{w}”), velike nesukladnosti {M0} → {M1}, male {m0} → {m1}, incidenti godišnje {i0} → {i1}.',
      nOver: 'Plan je preko proračuna za {x}: smanji neki cilj ili povećaj proračun.',
      nHides: 'Prosjek {a} izgleda dobro, a područje „{w}” ostaje na razini {l}: odande dolaze nalazi revizije i najveći dio incidenata.',
      nTop: 'Korak s 4 na 5 stoji 16 tjedana, s 1 na 2 samo 2, a neko je područje još ispod razine 3.',
      nClear: 'Bez nalaza: svako je područje barem definirano.',
      refTop: 'Područje „{w}” već je na razini 5.',
      refBottom: 'Područje „{w}” već je na razini 1.',
      refFloor: 'Cilj za područje „{w}” ne može biti ispod sadašnje razine.',
      refBudget: 'Idući korak za područje „{w}” stoji {k}, a u proračunu je još {x}.',
      refOver: 'Plan je već preko proračuna: prvo smanji neki cilj.',
      capNowOk: 'Prosjek je {a}, a najslabije područje, „{w}”, na razini je {l}: revizija ne nalazi nesukladnosti; iz njega dolazi {s} očekivanih incidenata.',

      foot: 'Pojednostavljeno, nije pravni savjet. Tvrtka, ocjene, troškovi i incidenti su izmišljeni.',

      explain:
        '<p><b>Razine zrelosti</b> (<i lang="en">maturity levels</i>) ocjenjuju svako <b>područje kontrola</b> ' +
        '(<i lang="en">control area</i>) na ljestvici od 1 do 5: <b>ad hoc</b> (ovisi o tome tko je dežuran), ' +
        '<b>ponovljivo</b> (isti ljudi to rade isto), <b>definirano</b> (zapisano i provodi se), <b>mjereno</b> ' +
        '(zna se koliko dobro radi) i <b>stalno se poboljšava</b> (mjerenja vode promjene).</p>' +
        '<ul>' +
        '<li><b>Prosjek skriva najslabije područje.</b> Revizija gleda svako područje posebno: <b>velika ' +
        'nesukladnost</b> (<i lang="en">major nonconformity</i>) u jednom ne poništava petice u drugima. Incidenti ' +
        'također ulaze kroz najslabije mjesto.</li>' +
        '<li><b>Svaka iduća razina skuplja je od prethodne</b> i donosi manje. Ovdje korak s 1 na 2 stoji dva ' +
        'tjedna rada i uklanja četiri incidenta godišnje; korak s 4 na 5 stoji šesnaest tjedana i uklanja pola ' +
        'incidenta.</li>' +
        '<li>Zato je bolji <b>cilj po području</b>, prema riziku, nego jedan cilj za sve: najslabije barem do ' +
        '„definirano”, važna područja više, a ostalo kakvo jest.</li>' +
        '</ul>' +
        '<p>U stvarnosti područja nemaju istu cijenu ni isti rizik; ovdje imaju, da se vidi oblik.</p>' +
        '<p>Certifikacija prema ISO/IEC 27001 je dobrovoljna; mjere koje traži Zakon o kibernetičkoj sigurnosti ' +
        '(NN 14/2024) pokrivaju slično područje.</p>' +
        '<p>Srodno: uzorkovanje u reviziji; politika, standard, procedura, zapis; registar rizika.</p>' +
        '<p>Odakle: ISO/IEC 27001:2022, točke 9.1 (praćenje i mjerenje), 9.2 (interna revizija) i 10.1 (stalno ' +
        'poboljšavanje); velike i male nesukladnosti kako ih razlikuju certifikacijska tijela (ISO/IEC 17021-1); ' +
        'razine sposobnosti procesa (ISO/IEC 33020); NIS2, Direktiva (EU) 2022/2555, čl. 21. st. 1. (mjere ' +
        'primjerene i razmjerne riziku).</p>'
    },

    en: {
      stage: 'Eight control areas: current and target maturity levels, cost, audit findings and incidents',

      area1: 'Asset inventory',
      area2: 'Access control',
      area3: 'Vulnerabilities and patches',
      area4: 'Backups',
      area5: 'Logging and monitoring',
      area6: 'Incident response',
      area7: 'Suppliers',
      area8: 'Awareness and training',
      lv1: 'ad hoc',
      lv2: 'repeatable',
      lv3: 'defined',
      lv4: 'measured',
      lv5: 'improving',

      // the radar
      headRadar: 'Levels by area',
      radarLabel: 'Radar of eight areas: target average {a}, the weakest is {w} at level {l}',
      weeks: ['{n} week', '{n} weeks'],
      budgetUse: 'Plan: {k} of {b}',
      budgetLeft: '{x} left',
      budgetOver: 'over budget by {x}',

      // the table
      headTable: 'Rate the current level and set a target (− and +)',
      colArea: 'Area',
      colNow: 'Now',
      colPlan: 'Target',
      colWeeks: 'Weeks',
      colAudit: 'Audit (target)',
      colInc: 'Incidents a year (target)',
      fMajor: 'major',
      fMinor: 'minor',
      fNone: 'none',
      bCurDown: '{w}: current level down',
      bCurUp: '{w}: current level up',
      bTgtDown: '{w}: target down',
      bTgtUp: '{w}: target up',

      // the comparison
      headCmp: 'Same budget ({b}), four plans',
      cmpPlan: 'Plan',
      cmpCost: 'Cost',
      cmpAvg: 'Average',
      cmpWeak: 'Weakest area',
      cmpAudit: 'Nonconformities',
      cmpInc: 'Incidents a year',
      plan_now: 'Now, no plan',
      plan_plus1: '+1 everywhere',
      plan_floor: 'At least 3 everywhere',
      plan_yours: 'Your plan',
      fits: 'fits',
      overBy: 'over by {x}',
      shareOf: '{s} from the weakest',

      // params, presets, legend
      budget: 'Budget',
      budgetOpt: '{n} wk',
      clear: 'Clear the plan',
      pAverageFine: 'The average looks fine',
      pAverageFineHint: 'Average 3.25, and logging and monitoring is at level 1.',
      pPlusOne: 'Everything one level up',
      pPlusOneHint: 'Every area +1: 90 weeks, and the weakest stays the weakest.',
      pFloor: 'Weakest up to defined',
      pFloorHint: 'Only logging and monitoring from 1 to 3: 6 weeks.',
      pPerArea: 'A target per area',
      pPerAreaHint: 'The weakest to 3, two important ones to 4: 22 of 24 weeks.',
      pShowcase: 'A showcase and a gap',
      pShowcaseHint: 'Average 3.75, and suppliers are at level 1.',
      pShowcaseFloor: 'Showcase: fill the gaps',
      pShowcaseFloorHint: 'Suppliers and logging to 3 on a 12-week budget.',
      legNow: 'now',
      legPlan: 'target',
      legAvg: 'target average',
      legLine: 'audit line (3)',
      legWeak: 'the weakest',
      legMajor: 'major nonconformity',
      legMinor: 'minor nonconformity',

      // the caption
      capNow: 'The average is {a}, but the area “{w}” is at level {l}. Nonconformities in the audit: {M} major, {m} minor; {s} of the expected incidents come from the weakest area.',
      capPlan: 'Plan for {k} of {b}: average {a0} → {a1}, weakest {l0} → {l1} (“{w}”), major nonconformities {M0} → {M1}, minor {m0} → {m1}, incidents a year {i0} → {i1}.',
      nOver: 'The plan is over budget by {x}: lower a target or raise the budget.',
      nHides: 'An average of {a} looks fine, yet the area “{w}” stays at level {l}: the audit findings and the largest share of incidents come from it.',
      nTop: 'A step from 4 to 5 costs 16 weeks, from 1 to 2 only 2, and some area is still below level 3.',
      nClear: 'No findings: every area is at least defined.',
      refTop: 'The area “{w}” is already at level 5.',
      refBottom: 'The area “{w}” is already at level 1.',
      refFloor: 'The target for “{w}” cannot be below its current level.',
      refBudget: 'The next step for “{w}” costs {k}, with {x} left.',
      refOver: 'The plan is already over budget: lower a target first.',
      capNowOk: 'The average is {a}, and the weakest area, “{w}”, is at level {l}: the audit finds no nonconformities; {s} of the expected incidents come from it.',

      foot: 'Simplified, not legal advice. The firm, ratings, costs and incidents are made up.',

      explain:
        '<p><b>Maturity levels</b> rate each <b>control area</b> on a scale from 1 to 5: <b>ad hoc</b> (depends ' +
        'on who is on duty), <b>repeatable</b> (the same people do it the same way), <b>defined</b> (written down ' +
        'and followed), <b>measured</b> (how well it works is known) and <b>improving</b> (the measurements drive ' +
        'changes).</p>' +
        '<ul>' +
        '<li><b>The average hides the weakest area.</b> An audit looks at each area on its own: a <b>major ' +
        'nonconformity</b> in one is not cancelled by fives elsewhere. Incidents also come in through the weakest ' +
        'spot.</li>' +
        '<li><b>Each level up costs more than the last</b> and buys less. Here a step from 1 to 2 costs two weeks ' +
        'of work and removes four incidents a year; a step from 4 to 5 costs sixteen weeks and removes half an ' +
        'incident.</li>' +
        '<li>So a <b>target per area</b>, set by risk, beats one target for everything: the weakest at least to ' +
        '“defined”, the important areas higher, the rest as they are.</li>' +
        '</ul>' +
        '<p>Real areas differ in cost and in risk; here they are alike, so the shape shows.</p>' +
        '<p>ISO/IEC 27001 certification is voluntary; the measures the Croatian Zakon o kibernetičkoj sigurnosti ' +
        '(NN 14/2024) requires cover similar ground.</p>' +
        '<p>Related: audit sampling; policy, standard, procedure, record; risk register.</p>' +
        '<p>Sources: ISO/IEC 27001:2022, clauses 9.1 (monitoring and measurement), 9.2 (internal audit) and 10.1 ' +
        '(continual improvement); major and minor nonconformities as certification bodies grade them (ISO/IEC ' +
        '17021-1); process capability levels (ISO/IEC 33020); NIS2, Directive (EU) 2022/2555, art. 21(1) (measures ' +
        'appropriate and proportionate to the risk).</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
