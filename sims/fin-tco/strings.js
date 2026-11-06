/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of fin-tco, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   The title and subtitle come from sim.json. Numbers are formatted in the page (index.html) and passed in. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Dvije mogućnosti, stavku po stavku: što svaka košta kroz odabrano razdoblje',
      horizon: 'Razdoblje usporedbe',
      horizonHint: 'Koliko godina mogućnost koristiš.',
      allOn: 'Uključi sve stavke',
      nYears: ['{n} godina', '{n} godine', '{n} godina'],
      overYears: ['kroz {n} godinu', 'kroz {n} godine', 'kroz {n} godina'],
      upToYears: ['do {n} godine', 'do {n} godine', 'do {n} godina'],
      fromYears: ['od {n} godine', 'od {n} godine', 'od {n} godina'],
      line_purchase: 'Nabavna cijena',
      line_setup: 'Uvođenje i migracija',
      line_training: 'Obuka',
      line_power: 'Struja i hlađenje',
      line_space: 'Prostor (ormar, prostorija)',
      line_support: 'Podrška, licence, naknade',
      line_staff: 'Vrijeme djelatnika (50 €/h)',
      line_exit: 'Izlazak na kraju',
      when_start: 'jednokratno, na početku',
      when_year: 'svake godine',
      when_end: 'jednokratno, na kraju',
      pair_serversA: 'jeftiniji poslužitelj',
      pair_serversB: 'skuplji, učinkovitiji poslužitelj',
      pair_buildA: 'razvoj u kući',
      pair_buildB: 'gotova usluga',
      pair_exitA: 'usluga',
      pair_exitB: 'vlastita oprema',
      perYear: '{x}/god.',
      hoursYear: '{n} h/god.',
      switchLabel: 'Uračunaj stavku: {line}',
      barLabel: '{line}, mogućnost {opt}',
      barValue: '{amount}; {over}: {total}',
      rowTotal: 'Ukupno {over}',
      cheaperBadge: 'jeftinije',
      tieBadge: 'jednako',
      shareOf: 'nabavna cijena: {p} ukupnog',
      noShare: 'nabavna cijena se ne računa',
      quoteCheaper: 'Na ponudi (samo nabavna cijena) jeftinija je {w}, za {d}.',
      quoteTie: 'Na ponudi (samo nabavna cijena) obje koštaju jednako.',
      stripLabel: 'Jeftinija uz razdoblje od (godina):',
      stripChip: '{n}: {w}',
      stripTie: 'jednako',
      dragHint: 'Povuci traku ili je odaberi i koristi strelice; prekidač uz stavku uračunava je za obje mogućnosti.',
      illustrative: 'Iznosi su izmišljeni, ali uvjerljivi; nominalni euri, bez diskontiranja.',
      eur: '{n}\u00a0€',
      pct: '{n} %',
      pCheaperPurchase: 'Jeftinija kupnja',
      pCheaperPurchaseHint: 'Poslužitelj od 6 000 € i od 10 000 €: kroz pet godina skuplji je onaj jeftiniji.',
      pShortHorizon: 'Kratko razdoblje',
      pShortHorizonHint: 'Isti poslužitelji kroz dvije godine: jeftinija kupnja još vodi.',
      pPriceOnly: 'Samo ponuda',
      pPriceOnlyHint: 'Uključena je samo nabavna cijena: ono što pokazuje ponuda.',
      pBuildVsBuy: 'Razviti ili kupiti',
      pBuildVsBuyHint: 'Razvoj u kući: 4 000 € opreme i 500 sati rada godišnje; gotova usluga nema kupnje, ali ima pretplatu.',
      pStaffFree: 'Kao da je rad besplatan',
      pStaffFreeHint: 'Isto, s isključenim vremenom djelatnika: razvoj u kući izgleda gotovo besplatan.',
      pExitCost: 'Skup izlazak',
      pExitCostHint: 'Usluga bez kupnje, ali izlazak (izvoz podataka, migracija) košta 9 000 €; isključi ga.',
      legPrice: 'nabavna cijena',
      legOnce: 'ostalo jednokratno',
      legRunning: 'svake godine',
      legOff: 'stavka isključena',
      legCheaper: 'jeftinije za razdoblje',
      legChanged: 'promijenio se poredak',
      capCheaper: '{over}: A košta {a}, B {b}; jeftinija je {w}, za {d}.',
      capTie: '{over}: obje mogućnosti koštaju {a}.',
      capNothing: 'Sve su stavke isključene, pa obje mogućnosti koštaju 0 €.',
      nFlip: 'Jeftinija kupnja ({q}) skuplja je mogućnost.',
      nHorizon: '{early} je jeftinija {upTo}, {late} {from}.',
      explain: '<p><b>Ukupni trošak vlasništva</b> (engl. <i lang="en">total cost of ownership</i>, TCO) zbraja sve što ' +
        'mogućnost košta kroz razdoblje u kojem je koristiš, a ne samo <i>nabavnu cijenu</i> s ponude. Stavke su ' +
        'tri vrste: <i>jednokratne</i> na početku (kupnja, uvođenje i migracija, obuka), <i>tekuće</i> svake godine ' +
        '(struja i hlađenje, prostor, podrška, licence i naknade, vrijeme djelatnika) i jednokratne na kraju ' +
        '(<i>izlazak</i>: izvoz podataka, migracija na sljedeće rješenje, zbrinjavanje opreme). Tekuće stavke množe ' +
        'se brojem godina, pa nabavna cijena često ispadne manji dio zbroja.</p>' +
        '<p><b>Jeftinija kupnja može biti skuplja mogućnost.</b> Jeftiniji uređaj može trošiti više struje, ' +
        'zauzimati više prostora i tražiti više rada; skuplji može doći s podrškom. Dok je razdoblje kratko, vodi niža cijena; što je ' +
        'dulje, to više teže tekući troškovi. Ukupni troškovi rastu linearno s duljinom razdoblja, pa se poredak promijeni ' +
        'najviše jednom: traka ispod tablice pokazuje gdje.</p>' +
        '<p><b>Razviti ili kupiti.</b> Vlastiti djelatnici nisu besplatni zato što su ionako na platnom popisu: sat ' +
        'potrošen na održavanje vlastitog rješenja nije potrošen na nešto drugo. Zato se njihovo vrijeme računa po ' +
        'punom trošku sata (plaća, doprinosi, režije). Bez te stavke razvoj u kući gotovo uvijek izgleda jeftinije.</p>' +
        '<p><b>Izlazak.</b> Usluga koju je lako uvesti može biti skupa za napustiti: izvoz velike količine podataka, ' +
        'usporedni rad dvaju sustava, migracija. Taj trošak dolazi na kraju i lako se zaboravi.</p>' +
        '<p>U unajmljenom ormaru (kolokacija) struja i prostor često se naplaćuju zajedno, po kW mjesečno. Pažljivija ' +
        'usporedba kroz više godina diskontira buduće iznose (neto sadašnja vrijednost) i računa s rastom cijena i ' +
        'zamjenom opreme; ovdje su svi iznosi nominalni.</p>'
    },
    en: {
      stage: 'Two options, line by line: what each costs over the chosen horizon',
      horizon: 'Horizon',
      horizonHint: 'How many years you use the option.',
      allOn: 'Switch every line on',
      nYears: ['{n} year', '{n} years'],
      overYears: ['over {n} year', 'over {n} years'],
      upToYears: ['up to {n} year', 'up to {n} years'],
      fromYears: ['from {n} year on', 'from {n} years on'],
      line_purchase: 'Purchase price',
      line_setup: 'Set-up and migration',
      line_training: 'Training',
      line_power: 'Power and cooling',
      line_space: 'Space (rack, room)',
      line_support: 'Support, licences, fees',
      line_staff: 'Staff time (€50/h)',
      line_exit: 'Exit at the end',
      when_start: 'once, at the start',
      when_year: 'every year',
      when_end: 'once, at the end',
      pair_serversA: 'the cheaper server',
      pair_serversB: 'the dearer, more efficient server',
      pair_buildA: 'build in house',
      pair_buildB: 'a ready-made service',
      pair_exitA: 'a service',
      pair_exitB: 'own equipment',
      perYear: '{x}/yr',
      hoursYear: '{n} h/yr',
      switchLabel: 'Count the line: {line}',
      barLabel: '{line}, option {opt}',
      barValue: '{amount}; {over}: {total}',
      rowTotal: 'Total {over}',
      cheaperBadge: 'cheaper',
      tieBadge: 'equal',
      shareOf: 'purchase price: {p} of the total',
      noShare: 'the purchase price is not counted',
      quoteCheaper: 'On the quote (purchase price alone) {w} is cheaper, by {d}.',
      quoteTie: 'On the quote (purchase price alone) both cost the same.',
      stripLabel: 'Cheaper with a horizon of (years):',
      stripChip: '{n}: {w}',
      stripTie: 'equal',
      dragHint: 'Drag a bar, or select it and use the arrow keys; the switch at each line counts it for both options.',
      illustrative: 'The amounts are made up but plausible; nominal euros, not discounted.',
      eur: '€{n}',
      pct: '{n}%',
      pCheaperPurchase: 'The cheaper purchase',
      pCheaperPurchaseHint: 'A €6,000 and a €10,000 server: over five years the cheaper one costs more.',
      pShortHorizon: 'A short horizon',
      pShortHorizonHint: 'The same servers over two years: the cheaper purchase still leads.',
      pPriceOnly: 'The quote alone',
      pPriceOnlyHint: 'Only the purchase price is switched on: what the quote shows.',
      pBuildVsBuy: 'Build or buy',
      pBuildVsBuyHint: 'Building in house: €4,000 of equipment and 500 staff hours a year; the ready-made service buys nothing but has a subscription.',
      pStaffFree: 'As if work were free',
      pStaffFreeHint: 'The same, with staff time switched off: building in house looks almost free.',
      pExitCost: 'A costly exit',
      pExitCostHint: 'A service with no purchase, but leaving it (data export, migration) costs €9,000; switch it off.',
      legPrice: 'purchase price',
      legOnce: 'other one-off costs',
      legRunning: 'every year',
      legOff: 'line switched off',
      legCheaper: 'cheaper over the horizon',
      legChanged: 'the ranking changed',
      capCheaper: '{over}: A costs {a}, B {b}; {w} is cheaper, by {d}.',
      capTie: '{over}: both options cost {a}.',
      capNothing: 'Every line is switched off, so both options cost €0.',
      nFlip: 'The cheaper purchase ({q}) is the dearer option.',
      nHorizon: '{early} is cheaper {upTo}, {late} {from}.',
      explain: '<p><b>Total cost of ownership</b> (TCO) adds up everything an option costs over the years you use it, ' +
        'not just the <i>purchase price</i> on the quote. The lines are of three kinds: <i>one-off</i> at the start ' +
        '(the purchase, set-up and migration, training), <i>running</i> every year (power and cooling, space, ' +
        'support, licences and fees, staff time) and one-off at the end (the <i>exit</i>: exporting the data, ' +
        'migrating to whatever comes next, disposing of the equipment). Running lines are multiplied by the number ' +
        'of years, so the purchase price often turns out to be the smaller part of the sum.</p>' +
        '<p><b>The cheaper purchase can be the dearer option.</b> A cheaper device may draw more power, take more ' +
        'space and need more work; a dearer one may come with support. Over a short horizon the lower price leads; the longer ' +
        'the horizon, the more the running costs weigh. Totals grow with the horizon in a straight line, so the ' +
        'ranking changes at most once: the strip under the table shows where.</p>' +
        '<p><b>Build or buy.</b> Your own staff are not free because they are on the payroll anyway: an hour spent ' +
        'keeping your own solution running is not spent on something else. So their time is counted at the full ' +
        'cost of an hour (salary, contributions, overhead). Without that line, building in house nearly always ' +
        'looks cheaper.</p>' +
        '<p><b>The exit.</b> A service that is easy to start can be costly to leave: exporting a lot of data, running ' +
        'two systems side by side, the migration. That cost comes at the end and is easy to forget.</p>' +
        '<p>In a rented rack (colocation) power and space are often billed together, per kW per month. A more careful ' +
        'comparison over several years discounts future amounts (net present value) and allows for price rises and ' +
        'replacing the equipment; here all amounts are nominal.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
