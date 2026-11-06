/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of fin-npv-discounting, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   The title and subtitle come from sim.json. Numbers are formatted in the page (index.html) and passed in. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Novčani tokovi kroz godine, nominalno i diskontirano',
      rate: 'Diskontna stopa (trošak kapitala)',
      rateHint: 'Koliko bi novac godišnje zaradio ili koštao drugdje.',
      years: 'Broj godina',
      mirror: 'Obrni redoslijed godina 1…n',
      pEuroLater: '100 000 € za pet godina',
      pEuroLaterHint: 'Jedan iznos na kraju 5. godine: uz 8 % danas vrijedi oko 68 000 €.',
      pUpgrade: 'Nadogradnja se isplati',
      pUpgradeHint: '120 000 € danas, 35 000 € uštede godišnje pet godina, uz 8 %.',
      pDearMoney: 'Isti projekt, skuplji novac',
      pDearMoneyHint: 'Isti tokovi uz 15 %: na papiru +55 000 €, a NSV ispod nule.',
      pJustTheRate: 'Točno trošak kapitala',
      pJustTheRateHint: '100 000 € danas, 108 000 € za godinu dana, uz 8 %: NSV je nula.',
      pLatePayoff: 'Povrat kasno',
      pLatePayoffHint: 'Povrat raste: 10, 20, 30, 40, 50 tisuća €. Usporedi s primjerom 6.',
      pEarlyPayoff: 'Povrat rano',
      pEarlyPayoffHint: 'Isti zbroj, obrnutim redom: 50, 40, 30, 20, 10 tisuća €.',
      legNominal: 'nominalni iznos (na papiru)',
      legToday: 'vrijednost danas (diskontirano)',
      legChanged: 'NSV je promijenila predznak',
      tileNominal: 'Na papiru',
      nominalSub: 'zbroj novčanih tokova, bez diskontiranja',
      tileNpv: 'Neto sadašnja vrijednost uz {rate}',
      npvLost: 'diskontiranje je oduzelo {x}',
      npvAdded: 'diskontiranje je dodalo {x}',
      verdictPos: 'NSV > 0: više od troška kapitala',
      verdictNeg: 'NSV < 0: novac bi drugdje donio više',
      verdictZero: 'NSV = 0: točno trošak kapitala',
      tileEuro: '1 € na kraju godine {n}',
      euroBig: '{x} danas',
      euroSub: 'diskontni faktor',
      today: 'danas',
      yearN: 'godina {n}',
      rowNominal: 'nominalno',
      rowFactor: 'faktor',
      rowToday: 'danas vrijedi',
      inflow: 'priljev ↑',
      outflow: 'odljev ↓',
      dragHint: 'Povuci stupac gore ili dolje (ili ↑/↓, sa Shiftom po 10 000 €).',
      barLabel: 'Novčani tok, {year}',
      barValue: '{cf}, danas {pv}',
      eur: '{n} €',
      pct: '{n} %',
      capPos: 'Uz {rate}, 1 € na kraju godine {n} danas vrijedi {euro}. Na papiru {nominal}, danas {npv}: ulaganje donosi više od troška kapitala.',
      capNeg: 'Uz {rate}, 1 € na kraju godine {n} danas vrijedi {euro}. Na papiru {nominal}, danas {npv}: novac bi drugdje donio više.',
      capZero: 'Uz {rate}, 1 € na kraju godine {n} danas vrijedi {euro}. Na papiru {nominal}, danas {npv}: ulaganje donosi točno trošak kapitala.',
      capEmpty: 'Još nema novčanih tokova. Povuci stupac gore ili dolje, ili odaberi primjer.',
      nRateZero: 'Uz 0 % ništa se ne diskontira: NSV je jednaka zbroju na papiru.',
      nTimeAte: 'Na papiru dobit, danas gubitak: razliku je pojelo vrijeme.',
      illustrative: 'Iznosi su izmišljeni, ali uvjerljivi.',
      explain: '<p><b>Euro sljedeće godine vrijedi manje od eura danas.</b> Novac koji imamo danas može ' +
        'raditi: uložen drugdje donosi kamatu, a posuđen košta kamatu. Ta godišnja stopa je <i>diskontna stopa</i> ' +
        '(engl. <i lang="en">discount rate</i>), a u poduzeću je to <i>trošak kapitala</i> (engl. <i lang="en">cost of ' +
        'capital</i>): ono što bi novac zaradio ili koštao negdje drugdje. Nije isto što i inflacija.</p>' +
        '<p>Iznos koji stiže na kraju godine <i>t</i> danas vrijedi <i>iznos</i> / (1 + <i>r</i>)<sup><i>t</i></sup>. ' +
        'Množitelj 1 / (1 + <i>r</i>)<sup><i>t</i></sup> je <i>diskontni faktor</i>; uz 8 % 1 € za pet godina danas vrijedi 0,68 €. Godina 0 je danas i ' +
        'ne diskontira se.</p>' +
        '<p><i>Neto sadašnja vrijednost</i> (NSV, engl. <i lang="en">net present value</i>, NPV) zbroj je svih ' +
        '<i>novčanih tokova</i> (engl. <i lang="en">cash flow</i>) preračunatih na današnju vrijednost: ulaganje ' +
        'danas je negativan tok, uštede i prihodi kasnije pozitivni. NSV &gt; 0 znači da ulaganje donosi više od ' +
        'troška kapitala, NSV &lt; 0 da bi novac drugdje donio više, a NSV = 0 da donosi točno toliko, što nije ' +
        'gubitak.</p>' +
        '<p>Zato zbroj na papiru vara: isti zbroj vrijedi više kad novac stiže ranije, a projekt koji je na papiru ' +
        'u plusu može uz skuplji novac imati negativnu NSV.</p>'
    },
    en: {
      stage: 'Cash flows over the years, nominal and discounted',
      rate: 'Discount rate (cost of capital)',
      rateHint: 'What the money would earn or cost elsewhere, per year.',
      years: 'Number of years',
      mirror: 'Reverse years 1…n',
      pEuroLater: '€100,000 in five years',
      pEuroLaterHint: 'One amount at the end of year 5: at 8% it is worth about €68,000 today.',
      pUpgrade: 'An upgrade that pays',
      pUpgradeHint: '€120,000 today, €35,000 saved a year for five years, at 8%.',
      pDearMoney: 'Same project, dearer money',
      pDearMoneyHint: 'The same flows at 15%: +€55,000 on paper, NPV below zero.',
      pJustTheRate: 'Exactly the cost of capital',
      pJustTheRateHint: '€100,000 today, €108,000 in a year, at 8%: the NPV is zero.',
      pLatePayoff: 'Late payoff',
      pLatePayoffHint: 'The return grows: 10, 20, 30, 40, 50 thousand euros. Compare with example 6.',
      pEarlyPayoff: 'Early payoff',
      pEarlyPayoffHint: 'The same total, in reverse: 50, 40, 30, 20, 10 thousand euros.',
      legNominal: 'nominal amount (on paper)',
      legToday: 'value today (discounted)',
      legChanged: 'the NPV changed sign',
      tileNominal: 'On paper',
      nominalSub: 'the cash flows added up, not discounted',
      tileNpv: 'Net present value at {rate}',
      npvLost: 'discounting took off {x}',
      npvAdded: 'discounting added {x}',
      verdictPos: 'NPV > 0: more than the cost of capital',
      verdictNeg: 'NPV < 0: the money would do better elsewhere',
      verdictZero: 'NPV = 0: exactly the cost of capital',
      tileEuro: '€1 at the end of year {n}',
      euroBig: '{x} today',
      euroSub: 'discount factor',
      today: 'today',
      yearN: 'year {n}',
      rowNominal: 'nominal',
      rowFactor: 'factor',
      rowToday: 'worth today',
      inflow: 'inflow ↑',
      outflow: 'outflow ↓',
      dragHint: 'Drag a column up or down (or ↑/↓, with Shift by €10,000).',
      barLabel: 'Cash flow, {year}',
      barValue: '{cf}, today {pv}',
      eur: '€{n}',
      pct: '{n}%',
      capPos: 'At {rate}, €1 at the end of year {n} is worth {euro} today. On paper {nominal}, today {npv}: the investment earns more than the cost of capital.',
      capNeg: 'At {rate}, €1 at the end of year {n} is worth {euro} today. On paper {nominal}, today {npv}: the money would do better elsewhere.',
      capZero: 'At {rate}, €1 at the end of year {n} is worth {euro} today. On paper {nominal}, today {npv}: the investment earns exactly the cost of capital.',
      capEmpty: 'No cash flows yet. Drag a column up or down, or pick an example.',
      nRateZero: 'At 0% nothing is discounted: the NPV equals the sum on paper.',
      nTimeAte: 'A gain on paper, a loss today: time ate the difference.',
      illustrative: 'The amounts are made up but plausible.',
      explain: '<p><b>A euro next year is worth less than a euro today.</b> Money you hold today can work: ' +
        'invested elsewhere it earns interest, borrowed it costs interest. That yearly rate is the <i>discount ' +
        'rate</i>, and in a company it is the <i>cost of capital</i>: what the money would earn or cost elsewhere. ' +
        'It is not the same as inflation.</p>' +
        '<p>An amount that arrives at the end of year <i>t</i> is worth <i>amount</i> / (1 + <i>r</i>)<sup><i>t</i></sup> ' +
        'today. The multiplier 1 / (1 + <i>r</i>)<sup><i>t</i></sup> is the <i>discount factor</i>; at 8%, €1 in five years is worth €0.68 today. Year 0 ' +
        'is today and is not discounted.</p>' +
        '<p>The <i>net present value</i> (NPV) adds up every <i>cash flow</i> converted to its value today: the ' +
        'investment today is a negative flow, the savings and income later are positive. NPV &gt; 0 means the ' +
        'investment earns more than the cost of capital, NPV &lt; 0 that the money would do better elsewhere, and ' +
        'NPV = 0 that it earns exactly that, which is not a loss.</p>' +
        '<p>That is why the sum on paper misleads: the same total is worth more when the money comes earlier, and a ' +
        'project that is positive on paper can have a negative NPV when money is dearer.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
