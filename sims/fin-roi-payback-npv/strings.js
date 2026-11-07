/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of fin-roi-payback-npv, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   The title and subtitle come from sim.json. Numbers and the project letters (A, B) are formatted in the page
   (index.html) and passed in. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Dva projekta, tri mjerila: povrat ulaganja, razdoblje povrata i NSV',
      rate: 'Diskontna stopa (trošak kapitala)',
      rateHint: 'Koliko bi novac godišnje zaradio ili koštao drugdje. Mijenja samo NSV.',
      years: 'Broj godina',
      pQuickVsSlow: 'Brzi dobitak ili spori veliki povrat',
      pQuickVsSlowHint: 'A vraća novac brzo, B kasnije, ali više. Uz 8 % mjerila se ne slažu.',
      pDearMoney: 'Isti projekti, skuplji novac',
      pDearMoneyHint: 'Isti tokovi uz 18 %: NSV sada bira A, a ROI i povrat ostaju isti.',
      pSameTotal: 'Isti zbroj, drugi redoslijed',
      pSameTotalHint: 'Oba vraćaju 150 000 €, A ranije: ROI je izjednačen jer ne gleda kada novac stiže.',
      pAfterPayback: 'Što dolazi nakon povrata',
      pAfterPaybackHint: 'Isti prve dvije godine, B donosi još 80 000 € u 5. godini: razdoblje povrata to ne vidi.',
      pAtTheSwap: 'Točno na presjeku',
      pAtTheSwapHint: 'Uz 10 % NSV obaju projekata je jednaka: to je stopa uz koju se krivulje sijeku.',
      pIrr: 'NSV nula: interna stopa povrata',
      pIrrHint: 'A ulaže 100 000 € danas i dobiva 110 000 € za godinu dana. Uz 10 % NSV projekta A je 0.',
      legA: 'projekt A',
      legB: 'projekt B',
      legPayback: 'trenutak povrata',
      legRate: 'odabrana stopa',
      legChanged: 'mjerilo je promijenilo izbor',
      thYardstick: 'Mjerilo',
      thPicks: 'Bira',
      project: 'Projekt {who}',
      rowRoi: 'Povrat ulaganja (ROI)',
      rowRoiSub: 'ne gleda kada novac stiže',
      rowPayback: 'Razdoblje povrata',
      rowPaybackSub: 'ne gleda ništa nakon povrata',
      rowNpv: 'NSV uz {rate}',
      rowNpvSub: 'ovisi o stopi',
      rowIrr: 'Interna stopa povrata (ISP)',
      rowIrrSub: 'stopa uz koju je NSV = 0',
      irrNoRank: 'nije glas, nego stopa',
      tie: 'izjednačeno',
      noPick: 'ne može se usporediti',
      none: 'nema',
      never: 'nikad',
      several: 'više njih',
      outside: 'nema u rasponu −90…1000 %',
      yearsOne: '{n} god.',
      yearsN: '{n} god.',
      flowsTitle: 'Novčani tokovi po godinama',
      profileTitle: 'NSV prema diskontnoj stopi',
      today: 'danas',
      yearN: 'god. {n}',
      inflow: 'priljev ↑',
      outflow: 'odljev ↓',
      irrMark: 'ISP {who}',
      swapMark: 'presjek',
      dragHint: 'Povuci stupac gore ili dolje (ili ↑/↓, sa Shiftom po 10 000 €).',
      barLabel: 'Projekt {who}, {year}',
      barValue: '{cf}',
      eur: '{n} €',
      pct: '{n} %',
      pickWho: 'bira {who}',
      pickTie: 'ne razlikuje projekte',
      pickNone: 'ne može ih usporediti',
      capAgree: 'Sva tri mjerila biraju {who}.',
      capDisagree: 'Mjerila se ne slažu: ROI {roi}, razdoblje povrata {payback}, NSV uz {rate} {npv}.',
      capPicks: 'ROI {roi}, razdoblje povrata {payback}, NSV uz {rate} {npv}.',
      capEmpty: 'Još nema novčanih tokova. Povuci stupac gore ili dolje, ili odaberi primjer.',
      swOne: 'Krivulje NSV-a sijeku se uz {x}: ispod te stope veću NSV ima {lo}, iznad nje {hi}.',
      swZero: 'Uz 0 % NSV je jednaka (isti zbroj na papiru), a uz svaku višu stopu veću NSV ima {hi}.',
      swNone: 'Uz svaku stopu od 0 do {max} veću NSV ima {who}.',
      swMany: 'Krivulje NSV-a sijeku se više puta između 0 i {max}.',
      swSame: 'Oba projekta imaju iste novčane tokove.',
      nIrr: 'NSV projekta {who} uz {rate} je 0: {irr} je njegova interna stopa povrata.',
      nIrrSome: 'NSV projekta {who} uz {rate} je 0: {irr} je jedna od njegovih internih stopa povrata.',
      nAtSwap: 'Uz {rate} NSV obaju projekata je jednaka: to je stopa presjeka.',
      illustrative: 'Iznosi su izmišljeni, ali uvjerljivi.',
      explain: '<p><b>Tri mjerila, isti projekti, različit poredak.</b> Svako mjerilo nešto zanemaruje.</p>' +
        '<p><i>Povrat ulaganja</i> (engl. <i lang="en">return on investment</i>, ROI) ovdje je zbroj novčanih tokova ' +
        'na papiru podijeljen s uloženim: koliko se zaradi na svaki uloženi euro. Ne gleda <b>kada</b> novac stiže: ' +
        'euro u petoj godini vrijedi kao euro danas. Uz jednako ulaganje ROI poreda projekte kao NSV uz 0 %.</p>' +
        '<p><i>Razdoblje povrata</i> (engl. <i lang="en">payback period</i>) je vrijeme dok se uloženi novac ne ' +
        'vrati, zbrajajući tokove redom (unutar godine razmjerno). Lako ga je objasniti i govori koliko je dugo ' +
        'novac vezan, ali <b>ne vidi ništa nakon toga</b>: ni veliki priljev kasnije, ni trošak na kraju.</p>' +
        '<p><i>Neto sadašnja vrijednost</i> (NSV, engl. <i lang="en">NPV</i>) zbraja diskontirane tokove uz ' +
        '<i>trošak kapitala</i>. To je pravilo koje mjeri vrijednost, ali njezin poredak <b>ovisi o stopi</b>: ' +
        'kasni povrat gubi više kad je novac skuplji. Graf „NSV prema diskontnoj stopi” crta NSV obaju projekata za svaku stopu; ' +
        'gdje se krivulje sijeku, projekti mijenjaju mjesta.</p>' +
        '<p><i>Interna stopa povrata</i> (ISP, engl. <i lang="en">internal rate of return</i>, IRR) je stopa uz ' +
        'koju je NSV projekta točno 0, točka u kojoj njegova krivulja siječe nulu. Kod projekta koji prvo ulaže pa ' +
        'zarađuje NSV je pozitivna kad je trošak kapitala niži od ISP-a. Odluku donosi NSV uz stvarni trošak kapitala; ROI i razdoblje povrata dodatne su ' +
        'informacije.</p>'
    },
    en: {
      stage: 'Two projects, three yardsticks: ROI, payback period and NPV',
      rate: 'Discount rate (cost of capital)',
      rateHint: 'What the money would earn or cost elsewhere, per year. Only the NPV uses it.',
      years: 'Number of years',
      pQuickVsSlow: 'A quick win or a slow large return',
      pQuickVsSlowHint: 'A pays back fast, B later but more. At 8% the yardsticks disagree.',
      pDearMoney: 'Same projects, dearer money',
      pDearMoneyHint: 'The same flows at 18%: NPV now picks A, while ROI and payback stay put.',
      pSameTotal: 'Same total, different order',
      pSameTotalHint: 'Both return €150,000, A earlier: ROI ties because it ignores when the money comes.',
      pAfterPayback: 'What comes after payback',
      pAfterPaybackHint: 'The same for two years, then B brings €80,000 more in year 5: payback does not see it.',
      pAtTheSwap: 'Right at the crossing',
      pAtTheSwapHint: 'At 10% both NPVs are equal: the rate where the curves cross.',
      pIrr: 'NPV zero: the internal rate of return',
      pIrrHint: 'A invests €100,000 today and gets €110,000 a year later. At 10% A\'s NPV is 0.',
      legA: 'project A',
      legB: 'project B',
      legPayback: 'payback point',
      legRate: 'chosen rate',
      legChanged: 'a yardstick changed its pick',
      thYardstick: 'Yardstick',
      thPicks: 'Picks',
      project: 'Project {who}',
      rowRoi: 'Return on investment (ROI)',
      rowRoiSub: 'ignores when the money comes',
      rowPayback: 'Payback period',
      rowPaybackSub: 'ignores everything after it',
      rowNpv: 'NPV at {rate}',
      rowNpvSub: 'depends on the rate',
      rowIrr: 'Internal rate of return (IRR)',
      rowIrrSub: 'the rate at which NPV = 0',
      irrNoRank: 'a rate, not a vote',
      tie: 'a tie',
      noPick: 'cannot compare',
      none: 'none',
      never: 'never',
      several: 'several',
      outside: 'none in −90…1000%',
      yearsOne: '{n} year',
      yearsN: '{n} years',
      flowsTitle: 'Cash flows year by year',
      profileTitle: 'NPV against the discount rate',
      today: 'today',
      yearN: 'year {n}',
      inflow: 'inflow ↑',
      outflow: 'outflow ↓',
      irrMark: 'IRR {who}',
      swapMark: 'crossing',
      dragHint: 'Drag a column up or down (or ↑/↓, with Shift by €10,000).',
      barLabel: 'Project {who}, {year}',
      barValue: '{cf}',
      eur: '€{n}',
      pct: '{n}%',
      pickWho: 'picks {who}',
      pickTie: 'ties',
      pickNone: 'cannot compare',
      capAgree: 'All three yardsticks pick {who}.',
      capDisagree: 'The yardsticks disagree: ROI {roi}, payback {payback}, NPV at {rate} {npv}.',
      capPicks: 'ROI {roi}, payback {payback}, NPV at {rate} {npv}.',
      capEmpty: 'No cash flows yet. Drag a column up or down, or pick an example.',
      swOne: 'The NPV curves cross at {x}: below that rate {lo} has the higher NPV, above it {hi}.',
      swZero: 'At 0% the NPVs are equal (the same sum on paper); at every higher rate {hi} has the higher NPV.',
      swNone: '{who} has the higher NPV at every rate from 0 to {max}.',
      swMany: 'The NPV curves cross more than once between 0 and {max}.',
      swSame: 'Both projects have the same cash flows.',
      nIrr: 'Project {who}\'s NPV at {rate} is 0: {irr} is its internal rate of return.',
      nIrrSome: 'Project {who}\'s NPV at {rate} is 0: {irr} is one of its internal rates of return.',
      nAtSwap: 'At {rate} both NPVs are equal: this is the crossover rate.',
      illustrative: 'The amounts are made up but plausible.',
      explain: '<p><b>Three yardsticks, the same projects, a different order.</b> Each one leaves something out.</p>' +
        '<p><i>Return on investment</i> (ROI) here is the cash flows added up on paper, divided by the amount put ' +
        'in: what each euro invested earns. It ignores <b>when</b> the money comes: a euro in year five counts like ' +
        'a euro today. With equal investments, ROI ranks the projects as NPV does at 0%.</p>' +
        '<p>The <i>payback period</i> is how long until the money put in comes back, adding the flows in order ' +
        '(pro rata within a year). It is easy to explain and says how long the money is tied up, but it ' +
        '<b>sees nothing after that</b>: neither a large inflow later nor a cost at the end.</p>' +
        '<p>The <i>net present value</i> (NPV) adds up the flows discounted at the <i>cost of capital</i>. It is ' +
        'the rule that measures value, but its ranking <b>depends on the rate</b>: a late return loses more when ' +
        'money is dearer. The chart "NPV against the discount rate" draws both NPVs at every rate; where the curves cross, the ' +
        'projects swap places.</p>' +
        '<p>The <i>internal rate of return</i> (IRR) is the rate at which a project\'s NPV is exactly 0, the point ' +
        'where its curve crosses zero. For a project that invests first and earns later, the NPV is positive when the ' +
        'cost of capital is below the IRR. The decision ' +
        'rests on the NPV at the real cost of capital; ROI and payback are extra information.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
