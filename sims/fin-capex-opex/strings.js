/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of fin-capex-opex, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   The title and subtitle come from sim.json. Numbers are formatted in the page (index.html) and passed in. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Ista svota kao kupnja i kao usluga: novac, trošak i knjigovodstvena vrijednost po mjesecima',
      price: 'Cijena',
      priceHint: 'Usluga ukupno košta isto, po mjesecima.',
      life: 'Vijek uporabe (= trajanje usluge)',
      threshold: 'Prag kapitalizacije',
      thresholdHint: 'Kupnja ispod praga odmah ide u trošak.',
      month: 'Mjesec (0 = dan kupnje)',
      nYears: ['{n} godina', '{n} godine', '{n} godina'],
      nMonths: ['{n} mjesec', '{n} mjeseca', '{n} mjeseci'],
      pServer: 'Poslužitelj ili usluga',
      pServerHint: '30 000 € za poslužitelj ili 500 € mjesečno pet godina; kraj prve godine.',
      pDayOne: 'Dan kupnje',
      pDayOneHint: 'Sav novac za kupnju izlazi prvog dana, a trošak je još nula.',
      pEndOfLife: 'Kraj vijeka uporabe',
      pEndOfLifeHint: 'Nakon 60 mjeseci: isti novac, isti trošak, a EBITDA različita.',
      pSmallPurchase: 'Ispod praga',
      pSmallPurchaseHint: 'Mrežni preklopnik od 3 000 € uz prag od 5 000 €: odmah u trošak.',
      pAtThreshold: 'Točno na pragu',
      pAtThresholdHint: '5 000 € uz prag od 5 000 €: kapitalizira se (pravilo je ≥).',
      legCash: 'plaćeno (novac)',
      legExpense: 'trošak (račun dobiti i gubitka)',
      legBook: 'knjigovodstvena vrijednost (bilanca)',
      legCursor: 'odabrani mjesec',
      legChanged: 'kupnja je prešla prag',
      buyTitle: 'Kupnja',
      svcTitle: 'Usluga',
      kindCapex: 'kapitalni izdatak (CapEx)',
      kindOpex: 'operativni trošak (OpEx)',
      classCap: '{price} ≥ prag {thr}: kapitalizira se, amortizacija {dep} mjesečno',
      classExp: '{price} < prag {thr}: odmah u trošak',
      svcSub: '{fee} mjesečno, {months}: plaća se i ide u trošak svaki mjesec',
      budgetCapital: 'Investicijski budžet: {x} jednokratno, u 1. godini',
      budgetOpOnce: 'Operativni budžet: {x} jednokratno, u 1. godini',
      budgetOpYear: 'Operativni budžet: {x} godišnje',
      rowCash: 'Plaćeno dosad',
      rowExpense: 'Trošak dosad',
      rowBook: 'Knjigovodstvena vrijednost u bilanci',
      rowEbitda: 'Učinak na EBITDA dosad',
      dayOne: 'Dan kupnje',
      monthOf: 'Kraj {m}. od {n} mjeseci',
      cursorDay: 'dan kupnje',
      cursorMonth: '{m}. mj.',
      yearN: '{n}. god.',
      eur: '{n} €',
      buyCap: '{when}: za kupnju je prvog dana plaćeno {price}; od toga je {exp} otišlo u trošak kao amortizacija, a {book} je još u bilanci.',
      buyCapDay: '{when}: za kupnju je plaćeno {price} i sve je to u bilanci kao imovina; u trošak još nije otišlo ništa.',
      buyExp: '{when}: kupnja je ispod praga od {thr}, pa je cijelih {price} prvog dana otišlo u trošak i u bilanci nema ničega.',
      svcSoFar: 'Za uslugu je dosad plaćeno {svc} i sve je to već trošak.',
      svcNone: 'Za uslugu još nije plaćeno ništa.',
      nEbitdaBetter: 'Operativna dobit je ista, ali je EBITDA uz kupnju bolja za {x}: amortizacija se oduzima tek ispod nje.',
      nEbitdaWorse: 'EBITDA je uz kupnju lošija za {x}: cijela je cijena odjednom otišla u trošak.',
      nEnd: 'Kraj vijeka uporabe: isti novac, isti trošak, u bilanci ništa, a EBITDA je uz kupnju i dalje bolja za {x}.',
      nEndSame: 'Kraj vijeka uporabe: isti novac, isti trošak i ista EBITDA.',
      illustrative: 'Iznosi su izmišljeni, ali uvjerljivi. Usluga ovdje ukupno košta jednako kao kupnja, da se usporedi isto s istim.',
      explain: '<p><b>Ista svota, dva načina knjiženja.</b> Kod kupnje (<i>kapitalni izdatak</i>, engl. <i lang="en">capital ' +
        'expenditure</i>, CapEx) novac izlazi prvog dana, ali se trošak raspoređuje kroz <i>korisni vijek uporabe</i> kao ' +
        '<i>amortizacija</i> (engl. <i lang="en">depreciation</i>): kod linearne amortizacije svaki mjesec cijena / broj ' +
        'mjeseci. Ostatak je dotad <i>imovina</i> u <i>bilanci</i>, po <i>knjigovodstvenoj vrijednosti</i> (engl. ' +
        '<i lang="en">book value</i>). Ovdje uvijek vrijedi: plaćeno = trošak + knjigovodstvena vrijednost. Pravila za opremu ' +
        'daje MRS 16 (engl. IAS 16).</p>' +
        '<p>Usluga (<i>operativni trošak</i>, engl. <i lang="en">operating expense</i>, OpEx) plaća se i ide u trošak ' +
        'mjesec po mjesec; u bilanci nema ničega.</p>' +
        '<p><b>Dva budžeta.</b> Kupnja troši <i>investicijski budžet</i>, cijelu cijenu u godini kupnje; usluga troši ' +
        '<i>operativni budžet</i> svaki mjesec. Tim kojem je ostalo investicijskog budžeta, a nema prostora u ' +
        'operativnom, zato kupuje; u obrnutom slučaju se pretplaćuje.</p>' +
        '<p><b>Zašto EBITDA voli kupnju.</b> EBITDA (dobit prije kamata, poreza i amortizacije) ne vidi amortizaciju, ' +
        'pa je kupnja ne dira, a usluga je smanjuje svaki mjesec. <i>Operativna dobit</i> (nakon amortizacije) ovdje ' +
        'je ista, jer obje mogućnosti troše istu svotu kroz iste mjesece. Bolja EBITDA ne znači da je potrošeno manje: ' +
        'novac je samo otišao ranije.</p>' +
        '<p><b>Prag kapitalizacije.</b> Računovodstvena politika poduzeća određuje iznos ispod kojeg kupnja odmah ide ' +
        'u trošak, jer se ne isplati godinama pratiti sitnu imovinu. Tada cijela cijena odjednom ' +
        'ulazi u trošak i u EBITDA i troši operativni budžet. Ovdje se cijena jednaka pragu kapitalizira; politike to ' +
        'pišu različito.</p>' +
        '<p>U stvarnosti usluga ukupno obično stoji više (marža pružatelja), ali ne veže novac unaprijed.</p>'
    },
    en: {
      stage: 'The same amount as a purchase and as a service: cash, expense and book value month by month',
      price: 'Price',
      priceHint: 'The service costs the same in total, by the month.',
      life: 'Useful life (= the service\'s term)',
      threshold: 'Capitalisation threshold',
      thresholdHint: 'A purchase below it is expensed at once.',
      month: 'Month (0 = day one)',
      nYears: ['{n} year', '{n} years'],
      nMonths: ['{n} month', '{n} months'],
      pServer: 'A server or a service',
      pServerHint: '€30,000 for a server or €500 a month for five years; end of year 1.',
      pDayOne: 'Day one',
      pDayOneHint: 'All the purchase\'s cash leaves on day one, and nothing is expensed yet.',
      pEndOfLife: 'End of the useful life',
      pEndOfLifeHint: 'After 60 months: same cash, same expense, different EBITDA.',
      pSmallPurchase: 'Below the threshold',
      pSmallPurchaseHint: 'A €3,000 network switch under a €5,000 threshold: expensed at once.',
      pAtThreshold: 'Exactly at the threshold',
      pAtThresholdHint: '€5,000 with a €5,000 threshold: capitalised (the rule is ≥).',
      legCash: 'cash paid',
      legExpense: 'expensed (profit and loss)',
      legBook: 'book value (balance sheet)',
      legCursor: 'the chosen month',
      legChanged: 'the purchase crossed the threshold',
      buyTitle: 'Buy',
      svcTitle: 'Service',
      kindCapex: 'capital expenditure (CapEx)',
      kindOpex: 'operating expense (OpEx)',
      classCap: '{price} ≥ threshold {thr}: capitalised, depreciated {dep} a month',
      classExp: '{price} < threshold {thr}: expensed at once',
      svcSub: '{fee} a month for {months}: paid and expensed every month',
      budgetCapital: 'Capital budget: {x} once, in year 1',
      budgetOpOnce: 'Operating budget: {x} once, in year 1',
      budgetOpYear: 'Operating budget: {x} a year',
      rowCash: 'Cash paid so far',
      rowExpense: 'Expensed so far',
      rowBook: 'Book value on the balance sheet',
      rowEbitda: 'Effect on EBITDA so far',
      dayOne: 'Day one',
      monthOf: 'End of month {m} of {n}',
      cursorDay: 'day one',
      cursorMonth: 'month {m}',
      yearN: 'year {n}',
      eur: '€{n}',
      buyCap: '{when}: {price} was paid for the purchase on day one; {exp} of it is expensed as depreciation and {book} is still on the balance sheet.',
      buyCapDay: '{when}: {price} was paid for the purchase, and all of it is on the balance sheet as an asset; nothing is expensed yet.',
      buyExp: '{when}: the purchase is below the {thr} threshold, so its whole {price} was expensed on day one and nothing is on the balance sheet.',
      svcSoFar: '{svc} has been paid for the service so far, all of it expensed.',
      svcNone: 'Nothing has been paid for the service yet.',
      nEbitdaBetter: 'Operating profit is the same, but EBITDA is {x} better with the purchase: depreciation is taken off below it.',
      nEbitdaWorse: 'EBITDA is {x} worse with the purchase: the whole price was expensed at once.',
      nEnd: 'End of the useful life: same cash, same expense, nothing on the balance sheet, yet EBITDA is still {x} better with the purchase.',
      nEndSame: 'End of the useful life: same cash, same expense and the same EBITDA.',
      illustrative: 'The amounts are made up but plausible. The service costs the same in total as the purchase here, to compare like with like.',
      explain: '<p><b>The same amount, booked two ways.</b> When you buy (<i>capital expenditure</i>, CapEx) the cash ' +
        'leaves on day one, but the cost is spread over the <i>useful life</i> as <i>depreciation</i>: straight-line, ' +
        'the price ÷ the number of months, every month. Until then the rest sits on the <i>balance sheet</i> as an ' +
        '<i>asset</i> at its <i>book value</i>. Here it always holds: cash paid = expensed + book value. The rules for ' +
        'equipment are in IAS 16.</p>' +
        '<p>A service (<i>operating expense</i>, OpEx) is paid and expensed month by month; nothing goes on the balance ' +
        'sheet.</p>' +
        '<p><b>Two budgets.</b> The purchase draws on the <i>capital budget</i>, the whole price in the year it is ' +
        'bought; the service draws on the <i>operating budget</i> every month. A team with capital budget left but no ' +
        'operating headroom therefore buys; the other way round, it subscribes.</p>' +
        '<p><b>Why EBITDA likes buying.</b> EBITDA (earnings before interest, taxes, depreciation and amortisation) ' +
        'does not see depreciation, so the purchase leaves it alone while the service lowers it every month. ' +
        '<i>Operating profit</i> (after depreciation) is the same here, because both spend the same amount over the ' +
        'same months. A better EBITDA does not mean less was spent: the cash just left earlier.</p>' +
        '<p><b>The capitalisation threshold.</b> A company\'s accounting policy sets an amount below which a purchase ' +
        'is expensed at once, because tracking a small asset for years costs more than it tells. Then the whole price ' +
        'hits the expense and EBITDA at once, and draws on the operating budget. Here a price equal to the threshold ' +
        'is capitalised; policies word it either way.</p>' +
        '<p>In practice a service usually costs more in total (the provider\'s margin), but it does not tie up cash ' +
        'upfront.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
