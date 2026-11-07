/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of fin-prepay-discount, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   The title and subtitle come from sim.json. Numbers are formatted in the page (index.html) and passed in. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Ugovor plaćen mjesečno ili unaprijed: stopa popusta, trošak i novčana rezerva',
      discount: 'Popust za plaćanje unaprijed',
      coc: 'Trošak kapitala',
      buffer: 'Novčana rezerva na početku',
      floor: 'Najmanja rezerva',
      price: 'Cijena ugovora godišnje',
      years: 'Plaćeno unaprijed',
      yearsN: ['{n} godina', '{n} godine', '{n} godina'],
      terms: 'Rok plaćanja',
      termsN: '{n} dana',
      termsNow: 'odmah',
      pYearUpfront: 'Godina unaprijed, 10 % popusta',
      pYearUpfrontHint: 'Prva godina plaćena odjednom: 10 % popusta vrijedi kao 26 % godišnje.',
      pThreeYears: 'Tri godine unaprijed, 10 % popusta',
      pThreeYearsHint: 'Istih 10 %, ali za tri godine unaprijed: ispod troška kapitala od 8 %.',
      pBiggerDiscount: 'Tri godine, 15 % popusta',
      pBiggerDiscountHint: 'Popust se isplati, ali rezerva pada ispod najmanje rezerve.',
      pTwoYears: 'Dvije godine, 12 % popusta',
      pTwoYearsHint: 'Isplati se, a rezerva ostaje iznad najmanje rezerve.',
      pLongTerms: 'Rok plaćanja 90 dana',
      pLongTermsHint: 'Kao primjer 1, ali plaćanje 90 dana nakon računa: isti trošak u knjigama, novac odlazi kasnije.',
      pNoDiscount: 'Unaprijed bez popusta',
      pNoDiscountHint: 'Tri godine unaprijed za punu cijenu: novac je vezan, a ništa se ne dobiva.',
      legMonthly: 'mjesečno plaćanje',
      legUpfront: 'plaćanje unaprijed',
      legFloor: 'najmanja rezerva',
      legChanged: 'odluka se promijenila',
      tileRate: 'Popust kao godišnja kamatna stopa',
      rateSub: '{d} popusta za plaćanje {months} unaprijed',
      monthsN: ['{n} mjesec', '{n} mjeseca', '{n} mjeseci'],
      rateNone: 'nema stope',
      cocLabel: 'trošak kapitala',
      rateLabel: 'stopa popusta',
      verdictTake: 'Isplati se: stopa je iznad troška kapitala',
      verdictSkip: 'Ne isplati se: novac drugdje vrijedi više',
      verdictEven: 'Svejedno: stopa je jednaka trošku kapitala',
      thWay: 'Način plaćanja',
      thPaid: 'Plaćeno ukupno',
      thPaidSub: 'na papiru',
      thCost: 'Danas vrijedi uz {rate}',
      thCostSub: 'sadašnja vrijednost uplata',
      thExpense: 'Trošak u knjigama',
      thExpenseSub: 'godina 1 · 2 · 3',
      thLow: 'Najniža rezerva',
      thLowSub: 'i kada',
      wayMonthly: 'Mjesečno',
      subMonthly: '{m} za svaki mjesec',
      wayUpfront: '{k} unaprijed',
      subUpfront: '{a} odjednom, {d} popusta',
      subUpfrontRest: '{a} odjednom, zatim {m} mjesečno',
      atSigning: 'pri potpisu',
      inMonth: 'u {n}. mjesecu',
      belowMark: 'ispod minimuma',
      chartTitle: 'Novčana rezerva kroz ugovor',
      chartNote: 'proračun dodaje {m} na početku svakog mjeseca',
      floorTag: 'najmanja {x}',
      monthN: '{n}. mj.',
      startN: 'potpis',
      eur: '{n}\u00a0€',
      pct: '{n}\u00a0%',
      capTake: 'Popust od {d} za plaćanje {months} unaprijed vrijedi kao {r} godišnje, više od troška kapitala od {c}: danas to uštedi {s} (na papiru {p}).',
      capSkip: 'Popust od {d} za plaćanje {months} unaprijed vrijedi kao {r} godišnje, manje od troška kapitala od {c}: danas to košta {s} više, iako na papiru štedi {p}.',
      capEven: 'Popust od {d} za plaćanje {months} unaprijed vrijedi kao {r} godišnje, točno koliko i trošak kapitala: svejedno je kako se plaća.',
      capNoDiscount: 'Bez popusta plaćanje {months} unaprijed ne donosi ništa (0 %), a uz trošak kapitala od {c} danas košta {s} više: novac je samo vezan.',
      nBelowFloor: 'Rezerva pada na {low} {when}, ispod najmanje rezerve od {f}.',
      nOverdrawn: 'Rezerva pada na {low} {when}: račun je u minusu.',
      nTied: 'Plaćanje unaprijed veže do {x}; rezerva ne pada ispod {low}.',
      nTerms: 'Uz rok od {n} dana svaka uplata odlazi {n} dana nakon računa; trošak u knjigama ostaje isti.',
      illustrative: 'Iznosi su izmišljeni, ali uvjerljivi. Uplate dospijevaju {n} dana nakon računa; godina ima 365 dana.',
      illustrativeNow: 'Iznosi su izmišljeni, ali uvjerljivi. Računi se plaćaju odmah.',
      explain: '<p><b>Popust za plaćanje unaprijed je kamata pod drugim imenom.</b> Tko plati tri godine ' +
        'odjednom, posuđuje dobavljaču novac koji bi inače plaćao mjesec po mjesec, a popust je kamata na tu ' +
        'posudbu. Stopa je ona uz koju plaćanje unaprijed i mjesečno plaćanje danas vrijede jednako ' +
        '(<i>implicitna godišnja kamatna stopa</i>, engl. <i lang="en">implied annual rate</i>).</p>' +
        '<p>Istih 10 % ne znači isto: za godinu unaprijed novac je prosječno vezan oko pola godine, pa je stopa ' +
        'oko 26 %; za tri godine prosječno oko godinu i pol, pa je stopa samo 7,6 %. Usporedi je s ' +
        '<i>troškom kapitala</i> (engl. <i lang="en">cost of capital</i>), onim što bi novac poduzeća zaradio ' +
        'ili koštao drugdje. Ako je stopa veća, popust se isplati; ako je manja, novac drugdje vrijedi više.</p>' +
        '<p><b>Rok plaćanja pomiče novac, a ne trošak.</b> Uz rok od 30, 60 ili 90 dana (engl. <i lang="en">net ' +
        '30/60/90</i>) račun se plaća kasnije, pa novac dulje ostaje u poduzeću, ali trošak usluge u knjigama ' +
        'isti je: mjesec usluge knjiži se u svom mjesecu, kad god je plaćen. Uplata unaprijed u knjigama je ' +
        '<i>unaprijed plaćeni trošak</i> koji se priznaje kao rashod mjesec po mjesec. Kasnije plaćanje danas ' +
        'ipak malo vrijedi (stupac „danas vrijedi” malo pada), a upravo to dobavljač otkupljuje popustom za ' +
        'brže plaćanje.</p>' +
        '<p><b>Plaćanje unaprijed veže <i>obrtni kapital</i></b> (engl. <i lang="en">working capital</i>): ' +
        'novac odjednom odlazi iz <i>novčane rezerve</i>, a proračun ga vraća tek kroz godine. Ako rezerva padne ' +
        'ispod najmanje koju financije traže, popust koji se na papiru isplati može biti preskup. A plaćeni ' +
        'novac je zarobljen: ako dobavljač propadne ili usluga više nije potrebna, teško ga je vratiti.</p>' +
        '<p>Isto pravilo vrijedi za popust za brže plaćanje jednog računa: 2 % za plaćanje 20 dana ranije ' +
        'vrijedi kao oko 45 % godišnje.</p>'
    },
    en: {
      stage: 'A contract paid monthly or upfront: the discount\'s rate, the cost and the cash buffer',
      discount: 'Discount for paying upfront',
      coc: 'Cost of capital',
      buffer: 'Cash buffer at the start',
      floor: 'Minimum buffer',
      price: 'Contract price per year',
      years: 'Paid upfront',
      yearsN: ['{n} year', '{n} years'],
      terms: 'Payment terms',
      termsN: '{n} days',
      termsNow: 'on receipt',
      pYearUpfront: 'A year upfront, 10% off',
      pYearUpfrontHint: 'The first year paid at once: 10% off is worth 26% a year.',
      pThreeYears: 'Three years upfront, 10% off',
      pThreeYearsHint: 'The same 10%, but for three years upfront: below the 8% cost of capital.',
      pBiggerDiscount: 'Three years, 15% off',
      pBiggerDiscountHint: 'The discount pays, but the buffer falls below the minimum.',
      pTwoYears: 'Two years, 12% off',
      pTwoYearsHint: 'It pays, and the buffer stays above the minimum.',
      pLongTerms: '90-day payment terms',
      pLongTermsHint: 'As example 1, but paid 90 days after the invoice: the same expense in the books, the cash leaves later.',
      pNoDiscount: 'Upfront without a discount',
      pNoDiscountHint: 'Three years upfront at the full price: the money is tied up for nothing.',
      legMonthly: 'paid monthly',
      legUpfront: 'paid upfront',
      legFloor: 'minimum buffer',
      legChanged: 'the verdict changed',
      tileRate: 'The discount as a yearly interest rate',
      rateSub: '{d} off for paying {months} upfront',
      monthsN: ['{n} month', '{n} months'],
      rateNone: 'no rate',
      cocLabel: 'cost of capital',
      rateLabel: 'implied rate',
      verdictTake: 'It pays: the rate is above the cost of capital',
      verdictSkip: 'It does not pay: the money is worth more elsewhere',
      verdictEven: 'No difference: the rate equals the cost of capital',
      thWay: 'How it is paid',
      thPaid: 'Paid in total',
      thPaidSub: 'on paper',
      thCost: 'Worth today at {rate}',
      thCostSub: 'present value of the payments',
      thExpense: 'Expense in the books',
      thExpenseSub: 'year 1 · 2 · 3',
      thLow: 'Lowest buffer',
      thLowSub: 'and when',
      wayMonthly: 'Monthly',
      subMonthly: '{m} for each month',
      wayUpfront: 'Upfront, {k}',
      subUpfront: '{a} at once, {d} off',
      subUpfrontRest: '{a} at once, then {m} a month',
      atSigning: 'at signing',
      inMonth: 'in month {n}',
      belowMark: 'below the minimum',
      chartTitle: 'Cash buffer over the contract',
      chartNote: 'the budget adds {m} at the start of every month',
      floorTag: 'minimum {x}',
      monthN: 'month {n}',
      startN: 'signing',
      eur: '€{n}',
      pct: '{n}%',
      capTake: '{d} off for paying {months} upfront is worth {r} a year, more than the {c} cost of capital: in today\'s money it saves {s} ({p} on paper).',
      capSkip: '{d} off for paying {months} upfront is worth {r} a year, less than the {c} cost of capital: in today\'s money it costs {s} more, though it saves {p} on paper.',
      capEven: '{d} off for paying {months} upfront is worth {r} a year, exactly the cost of capital: either way of paying is the same.',
      capNoDiscount: 'Without a discount, paying {months} upfront earns nothing (0%), and at the {c} cost of capital it costs {s} more in today\'s money: the money is only tied up.',
      nBelowFloor: 'The buffer falls to {low} {when}, below the {f} minimum.',
      nOverdrawn: 'The buffer falls to {low} {when}: the account is overdrawn.',
      nTied: 'Paying upfront ties up as much as {x}; the buffer stays at {low} or above.',
      nTerms: 'With {n}-day terms every payment leaves {n} days after its invoice; the expense in the books stays the same.',
      illustrative: 'The amounts are made up but plausible. Payments are due {n} days after the invoice; a year has 365 days.',
      illustrativeNow: 'The amounts are made up but plausible. Invoices are paid on receipt.',
      explain: '<p><b>A discount for paying upfront is interest under another name.</b> Paying three years at ' +
        'once lends the vendor money you would otherwise pay month by month, and the discount is the interest on ' +
        'that loan. The rate is the one at which paying upfront and paying monthly are worth the same today (the ' +
        '<i>implied annual rate</i>).</p>' +
        '<p>The same 10% is not the same deal: for a year upfront the money is tied up for about half a year on ' +
        'average, so the rate is about 26%; for three years about a year and a half, so the rate is only 7.6%. ' +
        'Compare it with the <i>cost of capital</i>, what the firm\'s money would earn or cost elsewhere. If the ' +
        'rate is higher, the discount pays; if it is lower, the money is worth more elsewhere.</p>' +
        '<p><b>Payment terms move cash, not cost.</b> With 30, 60 or 90 days (net 30/60/90) the invoice is paid ' +
        'later, so the money stays in the firm longer, but the expense of the service in the books is the same: a ' +
        'month of service is booked in its own month, whenever it is paid. An upfront payment is a <i>prepaid ' +
        'expense</i> in the books, recognised as expense month by month. Paying later is still worth a little in ' +
        'today\'s money (the "worth today" column drops a little), and that is what a vendor buys back with a ' +
        'discount for paying sooner.</p>' +
        '<p><b>Paying upfront ties up <i>working capital</i>:</b> the money leaves the <i>cash buffer</i> at ' +
        'once and the budget brings it back only over the years. If the buffer falls below the minimum finance ' +
        'asks for, a discount that pays on paper can still be too dear. And money paid is locked in: if the ' +
        'vendor fails or the service is no longer needed, it is hard to get back.</p>' +
        '<p>The same rule applies to a discount for paying one invoice sooner: 2% for paying 20 days early is ' +
        'worth about 45% a year.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
