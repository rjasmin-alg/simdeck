/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of fin-refresh-cycle, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   The title and subtitle come from sim.json. Numbers are formatted in the page (index.html) and passed in. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Ekonomski vijek trajanja po duljini ciklusa i deset godina flote: isplate i trošak po godinama',
      cycle: 'Ciklus zamjene',
      cohorts: 'Skupine (postupna zamjena)',
      cohortsAll: 'sve odjednom',
      slow: 'Usporavanje',
      slowFmt: '{h} h/god. po godini starosti',
      slowHint: 'Sati radnog vremena koje korisnik godišnje izgubi na sporijem uređaju, za svaku godinu starosti.',
      slowOff: 'Izgubljeno radno vrijeme se ne računa.',
      staff: 'Računaj izgubljeno radno vrijeme',
      nYears: ['{n} godina', '{n} godine', '{n} godina'],
      everyN: ['svake {n} godine', 'svake {n} godine', 'svakih {n} godina'],
      nCohorts: ['{n} skupina', '{n} skupine', '{n} skupina'],
      nDevices: ['{n} uređaj', '{n} uređaja', '{n} uređaja'],
      nDevicesRange: '{a}–{b} uređaja',
      and: 'i',
      pWall: 'Sve odjednom',
      pWallHint: 'Cijela flota svake četiri godine: zid isplata u 1., 5. i 9. godini, a amortizacija je ravna.',
      pStaggered: 'Četiri skupine',
      pStaggeredHint: 'Isti ciklus od četiri godine, svake godine četvrtina flote: isplate su ravne, trošak po uređaju isti.',
      pStretched: 'Produljeno na sedam',
      pStretchedHint: 'Uređaji se drže sedam godina da se uštedi: kapitalni trošak pada, ali troškovi starenja rastu brže.',
      pBudget: 'Samo ono što proračun vidi',
      pBudgetHint: 'Isti plan od sedam godina bez izgubljenog radnog vremena: ekonomski vijek odjednom izgleda kao sedam godina.',
      pSlow: 'Stari uređaji usporavaju ljude',
      pSlowHint: 'Tri sata godišnje po godini starosti: ekonomski vijek pada na tri godine; tri skupine, ravne isplate.',
      legCapital: 'kapitalni trošak (amortizacija)',
      legNet: 'kupnja − preprodaja',
      legSupRep: 'podrška i popravci',
      legStaff: 'izgubljeno radno vrijeme (ne isplaćuje se)',
      legChosen: 'odabrani ciklus',
      legEcon: '★ ekonomski vijek',
      legChanged: 'promijenjeno',
      econTitle: 'Ekonomski vijek trajanja',
      econLine: 'Trošak po uređaju godišnje, po duljini ciklusa',
      cycleN: '{n} g.',
      fleetTitle: 'Deset godina flote',
      fleetLine: '{n} uređaja; svake godine lijevo isplate, desno trošak',
      thousand: 'tisuće €',
      yearN: '{n}.',
      cashBar: 'isplate',
      costBar: 'trošak',
      rowCapital: 'Kapitalni trošak (amortizacija)',
      rowSupRep: 'Podrška i popravci, prosjek',
      rowStaff: 'Izgubljeno radno vrijeme, prosjek',
      rowTotal: 'Ukupno po uređaju godišnje, ciklus od {years}',
      rowCash: 'Isplaćeno u 10 godina',
      rowExpense: 'Trošak u poslovnim knjigama, 10 godina',
      rowStaffT: 'Izgubljeno radno vrijeme, 10 godina',
      rowPeak: 'Godina s najviše isplata ({k}.) prema prosjeku',
      eur: '{n} €',
      times: '{x} ×',
      leadOne: 'Cijela flota od {m} mijenja se odjednom, {every}.',
      leadSome: 'Flota je podijeljena u {c} od po {m}; svaka se mijenja {every}, jedna za drugom.',
      leadEvery: 'Svake se godine mijenja jedna od {c} ({m}), pa svaki uređaj traje {years}.',
      atEcon: 'To je ekonomski vijek trajanja: {x} po uređaju godišnje, najmanje od svih ciklusa.',
      belowEcon: 'Kraće od ekonomskog vijeka ({e}): veći kapitalni trošak po godini nadmašuje uštedu na starenju, {d} po uređaju godišnje više, {f} godišnje za flotu.',
      aboveEcon: 'Dulje od ekonomskog vijeka ({e}): troškovi starenja rastu brže nego što pada kapitalni trošak, {d} po uređaju godišnje više, {f} godišnje za flotu.',
      cashWall: 'Isplate dolaze kao zid: {x} u {ys} godini, a amortizacija je svake godine ista, {dep}.',
      cashSpread: 'U godini s najviše isplata to je {x}, {r} prosjeka; amortizacija je svake godine ista, {dep}.',
      cashFlat: 'Isplate su gotovo iste svake godine, oko {x}, kao i trošak u knjigama.',
      nBudget: 'Izgubljeno radno vrijeme se ne računa, kao u proračunu: ekonomski vijek izgleda kao {e}, a s njim bi bio {alt}.',
      nStagger: 'Postupna zamjena u skupinama raspodijelila bi isplate kroz godine uz isti trošak po uređaju.',
      nSame: 'Trošak po uređaju godišnje isti je kao kad se sve mijenja odjednom; mijenja se samo raspored isplata.',
      illustrative: 'Iznosi su izmišljeni, ali uvjerljivi: {n} uređaja po {p}, jamstvo 3 godine, radni sat 40 €. Deset godina u ustaljenom ritmu zamjene.',
      explain: '<p><b>Kapitalni trošak po godini pada s duljinom ciklusa.</b> Uređaj koji se drži <i>n</i> godina ' +
        'amortizira se linearno kroz <i>vijek uporabe</i> od <i>n</i> godina do <i>ostatka vrijednosti</i>, onoga što ' +
        'se dobije preprodajom pri zamjeni: (cijena − preprodaja) ÷ <i>n</i> godišnje. Duži ciklus raspoređuje kupnju ' +
        'na više godina. Prodan po knjigovodstvenoj vrijednosti, ne donosi ni dobitak ni gubitak.</p>' +
        '<p><b>Troškovi starenja rastu.</b> Kad istekne jamstvo, plaćaju se ugovor o podršci i popravci; kvarovi su sve ' +
        'češći; stari uređaj je sporiji, a svaki kvar košta sate korisnika. Podrška i popravci izlaze iz blagajne. ' +
        'Izgubljeno radno vrijeme ne isplaćuje nitko (plaće su iste), pa ga proračun ne vidi, ali je stvarni trošak.</p>' +
        '<p><b>Ekonomski vijek trajanja</b> (engl. <i lang="en">economic life</i>) je ciklus s najmanjim zbrojem po ' +
        'uređaju godišnje. Dno krivulje je plitko: godina više ili manje malo mijenja, a rubovi su strmi. Ovdje se ne ' +
        'diskontira; s troškom kapitala ista se analiza radi s ekvivalentnim godišnjim troškom.</p>' +
        '<p><b>Isplate i trošak nisu isto.</b> Kad se cijela flota mijenja odjednom, isplate dolaze kao zid svakih ' +
        '<i>n</i> godina, a <i>amortizacija</i> kupnju raspoređuje ravnomjerno kroz vijek uporabe (MRS 16, engl. IAS 16), ' +
        'pa je trošak u knjigama svake godine isti. <b>Postupna zamjena</b> u skupinama raspoređuje i isplate; trošak ' +
        'po uređaju godišnje ostaje isti. U deset godina razlika između isplata i troška je promjena knjigovodstvene ' +
        'vrijednosti flote.</p>' +
        '<p><b>Pretpostavke.</b> 240 uređaja po 1 200 €; preprodajna vrijednost se svake godine prepolovi; jamstvo 3 ' +
        'godine, zatim podrška 8 % cijene godišnje i popravak 25 % cijene po kvaru; kvarovi 5 % u prvoj godini, svake ' +
        'godine 1,5 puta više; kvar odnese 6 sati korisnika; radni sat 40 €. Deset godina počinje u ustaljenom ritmu: ' +
        'svaka skupina kupljena je prije prve godine kako ciklus kaže.</p>'
    },
    en: {
      stage: 'Economic life by cycle length and ten years of the fleet: cash and cost by year',
      cycle: 'Refresh cycle',
      cohorts: 'Cohorts (staggered)',
      cohortsAll: 'all at once',
      slow: 'Slowdown',
      slowFmt: '{h} h a year per year of age',
      slowHint: 'Hours of work a user loses each year on a slower device, for every year of its age.',
      slowOff: 'Lost staff time is not counted.',
      staff: 'Count lost staff time',
      nYears: ['{n} year', '{n} years'],
      everyN: ['every {n} year', 'every {n} years'],
      nCohorts: ['{n} cohort', '{n} cohorts'],
      nDevices: ['{n} device', '{n} devices'],
      nDevicesRange: '{a}–{b} devices',
      and: 'and',
      pWall: 'All at once',
      pWallHint: 'The whole fleet every four years: a cash wall in years 1, 5 and 9, while depreciation stays flat.',
      pStaggered: 'Four cohorts',
      pStaggeredHint: 'The same four-year cycle, a quarter of the fleet each year: flat cash, the same cost per device.',
      pStretched: 'Stretched to seven',
      pStretchedHint: 'Devices kept seven years to save money: the capital cost falls, but ageing costs rise faster.',
      pBudget: 'Only what the budget sees',
      pBudgetHint: 'The same seven-year plan without lost staff time: the economic life suddenly looks like seven years.',
      pSlow: 'Old kit slows people down',
      pSlowHint: 'Three hours a year per year of age: the economic life drops to three years; three cohorts, flat cash.',
      legCapital: 'capital cost (depreciation)',
      legNet: 'purchases − resale',
      legSupRep: 'support and repairs',
      legStaff: 'lost staff time (not paid out)',
      legChosen: 'chosen cycle',
      legEcon: '★ economic life',
      legChanged: 'changed',
      econTitle: 'Economic life',
      econLine: 'Cost per device a year, by cycle length',
      cycleN: '{n} y',
      fleetTitle: 'Ten years of the fleet',
      fleetLine: '{n} devices; each year cash on the left, cost on the right',
      thousand: 'thousand €',
      yearN: '{n}',
      cashBar: 'cash',
      costBar: 'cost',
      rowCapital: 'Capital cost (depreciation)',
      rowSupRep: 'Support and repairs, average',
      rowStaff: 'Lost staff time, average',
      rowTotal: 'Total per device a year, cycle of {years}',
      rowCash: 'Cash paid out, 10 years',
      rowExpense: 'Expense in the books, 10 years',
      rowStaffT: 'Lost staff time, 10 years',
      rowPeak: 'Peak year (year {k}) against the average',
      eur: '€{n}',
      times: '{x}×',
      leadOne: 'The whole fleet of {m} is replaced at once, {every}.',
      leadSome: 'The fleet is split into {c} of {m}; each is replaced {every}, in turn.',
      leadEvery: 'Every year one of {c} ({m}) is replaced, so each device lasts {years}.',
      atEcon: 'That is the economic life: {x} per device a year, the lowest of all cycles.',
      belowEcon: 'Shorter than the economic life ({e}): the higher capital cost per year outweighs the saving on ageing, {d} per device a year more, {f} a year for the fleet.',
      aboveEcon: 'Longer than the economic life ({e}): ageing costs rise faster than the capital cost falls, {d} per device a year more, {f} a year for the fleet.',
      cashWall: 'Cash goes out as a wall: {x} in years {ys}, while depreciation is the same every year, {dep}.',
      cashSpread: 'The peak year of cash is {x}, {r} the average; depreciation is the same every year, {dep}.',
      cashFlat: 'Cash is almost the same every year, about {x}, as is the expense in the books.',
      nBudget: 'Lost staff time is left out, as in the budget: the economic life looks like {e}; counting it, it would be {alt}.',
      nStagger: 'Staggered cohorts would spread the cash over the years at the same cost per device.',
      nSame: 'The cost per device a year is the same as replacing all at once; only the timing of the cash changes.',
      illustrative: 'The amounts are made up but plausible: {n} devices at {p}, a 3-year warranty, staff time at €40 an hour. Ten years in a steady refresh rhythm.',
      explain: '<p><b>The capital cost per year falls as the cycle lengthens.</b> A device kept for <i>n</i> years is ' +
        'depreciated straight-line over a <i>useful life</i> of <i>n</i> years down to its <i>residual value</i>, what ' +
        'its resale brings at the refresh: (price − resale) ÷ <i>n</i> a year. A longer cycle spreads the purchase ' +
        'over more years. Sold at its book value, it books neither a gain nor a loss.</p>' +
        '<p><b>Ageing costs rise.</b> When the warranty ends, a support contract and repairs are paid; failures become ' +
        'more frequent; an old device is slower, and every failure costs the user hours. Support and repairs are cash. ' +
        'Lost staff time is paid by nobody (the salaries are the same), so the budget does not see it, but it is a real ' +
        'cost.</p>' +
        '<p>The <b>economic life</b> is the cycle with the lowest sum per device a year. The bottom of the curve is ' +
        'shallow: a year more or less changes little, while the edges are steep. Nothing is discounted here; with a ' +
        'cost of capital the same analysis uses the equivalent annual cost.</p>' +
        '<p><b>Cash and expense are not the same.</b> Refreshing the whole fleet at once makes a cash wall every ' +
        '<i>n</i> years, while <i>depreciation</i> spreads the purchase evenly over the useful life (IAS 16), so the ' +
        'expense in the books is the same every year. A <b>staggered</b> refresh in cohorts spreads the cash as well; ' +
        'the cost per device a year stays the same. Over ten years the difference between cash and expense is the ' +
        'change in the fleet\'s book value.</p>' +
        '<p><b>Assumptions.</b> 240 devices at €1,200; the resale value halves every year; a 3-year warranty, then ' +
        'support at 8% of the price a year and a repair at 25% of the price per failure; failures 5% in the first ' +
        'year, 1.5 times more each year; a failure takes 6 hours of the user\'s time; staff time at €40 an hour. The ' +
        'ten years start in a steady rhythm: each cohort was bought before year 1 as the cycle says.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
