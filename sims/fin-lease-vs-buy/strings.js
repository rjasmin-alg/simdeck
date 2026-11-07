/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of fin-lease-vs-buy, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   The title and subtitle come from sim.json. Amounts, rates and counts are formatted in the page (index.html) and
   passed in. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Isti poslužitelj na tri načina: novac, trošak, bilanca i NSV',
      price: 'Cijena poslužitelja',
      term: 'Trajanje (leasing i kredit)',
      termN: ['{n} godina', '{n} godine', '{n} godina'],
      lease: 'Mjesečna najamnina, % cijene',
      residual: 'Ostatak vrijednosti na kraju, % cijene',
      loanRate: 'Kamatna stopa kredita (godišnje)',
      coc: 'Trošak kapitala (godišnje)',
      end: 'Na kraju leasinga',
      endReturn: 'vrati',
      endBuyout: 'otkupi',
      endExtend: 'produlji 1 god.',
      books: 'Leasing u knjigama',
      booksRou: 'u bilanci',
      booksRent: 'kao najam',
      year: 'Bilanca na kraju godine',
      dayOne: 'prvi dan',
      pThreeWays: 'Tri načina za jedan poslužitelj',
      pThreeWaysHint: '60 000 €, tri godine: gotovina, kredit uz 6 % ili leasing; novac košta 8 %.',
      pLoanAtCoc: 'Kredit po trošku kapitala',
      pLoanAtCocHint: 'Kredit uz 8 %, a novac košta 8 %: više kamata, a ista NSV kao gotovina.',
      pDearMoney: 'Skup novac',
      pDearMoneyHint: 'Novac i kredit koštaju 14 %: leasing sada ima najveću NSV, iako plaća više novca od kupnje za gotovinu.',
      pBuyOut: 'Otkup na kraju',
      pBuyOutHint: 'Leasing se na kraju otkupi za ostatak vrijednosti: više plaćenog novca, ista NSV.',
      pExtend: 'Produljenje za godinu',
      pExtendHint: 'Još 12 najamnina za poslužitelj koji i dalje nije tvoj.',
      pAsRent: 'Leasing kao najam',
      pAsRentHint: 'Bez imovine i obveze u bilanci; trošak je svake godine isti.',
      legCash: 'gotovina',
      legLoan: 'kredit',
      legLease: 'leasing',
      legBest: 'najbolje u stupcu',
      legChanged: 'promijenio se izbor',
      wayCash: 'Kupnja za gotovinu',
      wayLoan: 'Kupnja na kredit',
      wayLease: 'Leasing',
      subCash: '{price} prvi dan',
      subLoan: '{n} × {a} uz {rate}',
      subLeaseReturn: '{n} × {q}, zatim povrat',
      subLeaseBuyout: '{n} × {q}, zatim otkup za {r}',
      subLeaseExtend: '{n} × {q} (12 više), zatim povrat',
      thWay: 'Način',
      thPaid: 'Plaćeno ukupno',
      thPaidSub: 'nominalno',
      thOwns: 'Ostaje u vlasništvu',
      thOwnsSub: 'vrijednost na kraju',
      thNpv: 'NSV uz {rate}',
      thNpvSub: 'diskontirano',
      thSheet: 'Bilanca, kraj {y}. god.',
      thSheetDay: 'Bilanca, prvi dan',
      thAsset: 'imovina',
      thLiab: 'obveza',
      nothing: 'ništa',
      cashTitle: 'Plaćeno do sada, mjesec po mjesec',
      expTitle: 'Trošak u svakoj godini',
      kDep: 'amortizacija',
      kInt: 'kamata',
      kRent: 'najamnina',
      yearN: '{n}. god.',
      endOfYear: 'kraj {n}. god.',
      eur: '{n} €',
      pct: '{n} %',
      nameCash: 'kupnja za gotovinu',
      nameLoan: 'kupnja na kredit',
      nameLease: 'leasing',
      and2: '{a} i {b}',
      all3: 'sva tri načina',
      capSame: 'I najmanje plaćenog novca i najveća NSV uz trošak kapitala ({rate}): {who}.',
      capDiffer: 'Najmanje plaćenog novca: {nom}. Najveća NSV uz trošak kapitala ({rate}): {val}.',
      nBuyout: 'Otkup na kraju plaća još {r}, ali ostaje poslužitelj vrijedan {v}: NSV leasinga ista je kao kad se vrati.',
      nExtend: 'Produljenje plaća još 12 najamnina ({x}); kupljeni poslužitelj ne traži više novca, a tada vrijedi {v}.',
      nLoanCoc: 'Kredit uz {loan} pomiče novac, ne vrijednost: diskontiran uz isti trošak kapitala ima istu NSV kao gotovina.',
      nLoanCheap: 'Kredit košta {loan}, a novac {coc}: otplata kroz vrijeme bolja je od gotovine, unatoč kamatama od {i}.',
      nRou: 'Kad je leasing u bilanci, njegov trošak u {y}. godini je {x} (amortizacija i kamata), a najamnine {r}: trošak je veći na početku, a manji kasnije, jer kamata pada.',
      nRouDay: 'Prvi dan leasing unosi {l} na obje strane bilance: imovinu s pravom uporabe i obvezu po najmu.',
      nRent: 'Kao najam leasing ostaje izvan bilance, a trošak su najamnine: {r} godišnje.',
      illustrative: 'Iznosi su izmišljeni, ali uvjerljivi; bez poreza. Plaćanja na kraju svakog mjeseca.',
      explain: '<p><b>Isti poslužitelj, tri načina plaćanja.</b> Kupnja za gotovinu plaća sve prvi dan. ' +
        'Kupnja na kredit plaća mjesečne <i>anuitete</i> s kamatom. <i>Leasing</i> (engl. <i lang="en">lease</i>) ' +
        'plaća mjesečnu najamninu, a na kraju se poslužitelj vraća, otkupljuje po <i>ostatku vrijednosti</i> ' +
        '(engl. <i lang="en">residual value</i>) ili se najam produljuje.</p>' +
        '<p><b>Novac, trošak i bilanca nisu isto.</b> Kupljeni poslužitelj je <i>imovina</i>: u trošak ide ' +
        '<i>amortizacijom</i> (engl. <i lang="en">depreciation</i>), a kredit je <i>obveza</i> u bilanci, kojoj se ' +
        'kamata dodaje kao trošak. Leasing se po međunarodnom standardu (MSFI 16) također knjiži u bilancu: ' +
        '<i>imovina s pravom uporabe</i> (engl. <i lang="en">right-of-use asset</i>) i <i>obveza po najmu</i>; tada je ' +
        'trošak amortizacija i kamata, veći na početku. Knjižen kao najam, leasing je samo trošak najamnine, svake ' +
        'godine isti; MSFI 16 to dopušta samo za kratke najmove (do 12 mjeseci) i opremu male vrijednosti, a ' +
        'stariji i neki nacionalni standardi šire. U svakom slučaju plaćeni novac jednak je trošku i promjeni imovine umanjenoj za promjenu obveze.</p>' +
        '<p><b>Pošteno je samo diskontirano.</b> Zbroj plaćenog novca ne vidi <i>kada</i> je novac plaćen ni što na ' +
        'kraju ostaje. <i>Neto sadašnja vrijednost</i> (NSV, engl. <i lang="en">NPV</i>) diskontira svako plaćanje ' +
        'uz <i>trošak kapitala</i> i dodaje vrijednost poslužitelja koji ostaje. Trošak kapitala ovdje je ono što vlastiti novac ' +
        'tvrtke zarađuje drugdje: kredit jeftiniji od njega bolji je od gotovine samo ako to doista vrijedi. Kredit uz stopu jednaku trošku ' +
        'kapitala ima istu NSV kao gotovina: pomiče novac, ne vrijednost. Otkup po ostatku vrijednosti također ne ' +
        'mijenja NSV: plaća se onoliko koliko poslužitelj vrijedi.</p>' +
        '<p><b>Pretpostavke.</b> Vrijednost poslužitelja pada ravnomjerno do ostatka vrijednosti i dalje istim ' +
        'tempom; kupljeni poslužitelj otpisuje se po toj crti. Kod produljenja sva tri načina gledaju se godinu dulje. ' +
        'Udžbenici leasing često diskontiraju po kamatnoj stopi zaduživanja, jer leasing nalikuje kreditu: izjednači ' +
        'trošak kapitala s kamatom kredita i vidjet ćeš tu usporedbu.</p>'
    },
    en: {
      stage: 'One server three ways: cash, expense, balance sheet and NPV',
      price: 'Price of the server',
      term: 'Term (lease and loan)',
      termN: ['{n} year', '{n} years'],
      lease: 'Monthly rental, % of the price',
      residual: 'Residual value at the end, % of the price',
      loanRate: 'Loan interest rate (per year)',
      coc: 'Cost of capital (per year)',
      end: 'At the end of the lease',
      endReturn: 'return',
      endBuyout: 'buy out',
      endExtend: 'extend 1 yr',
      books: 'The lease in the books',
      booksRou: 'on the balance sheet',
      booksRent: 'as rent',
      year: 'Balance sheet at the end of year',
      dayOne: 'day one',
      pThreeWays: 'Three ways to pay for one server',
      pThreeWaysHint: '€60,000 for three years: cash, a loan at 6% or a lease; money costs 8%.',
      pLoanAtCoc: 'A loan at the cost of capital',
      pLoanAtCocHint: 'The loan at 8% while money costs 8%: more interest, yet the same NPV as cash.',
      pDearMoney: 'Dear money',
      pDearMoneyHint: 'Money and the loan cost 14%: the lease now has the best NPV, though it pays more cash than buying outright.',
      pBuyOut: 'Buy out at the end',
      pBuyOutHint: 'The lease is bought out at the residual value: more cash paid, the same NPV.',
      pExtend: 'Extend by a year',
      pExtendHint: 'Twelve more rentals for a server you still do not own.',
      pAsRent: 'The lease as rent',
      pAsRentHint: 'No asset or liability on the balance sheet; the expense is the same every year.',
      legCash: 'cash',
      legLoan: 'loan',
      legLease: 'lease',
      legBest: 'best in its column',
      legChanged: 'a pick changed',
      wayCash: 'Buying for cash',
      wayLoan: 'Buying on a loan',
      wayLease: 'Leasing',
      subCash: '{price} on day one',
      subLoan: '{n} × {a} at {rate}',
      subLeaseReturn: '{n} × {q}, then returned',
      subLeaseBuyout: '{n} × {q}, then bought out for {r}',
      subLeaseExtend: '{n} × {q} (12 more), then returned',
      thWay: 'Way',
      thPaid: 'Cash paid in total',
      thPaidSub: 'nominal',
      thOwns: 'Still owned',
      thOwnsSub: 'value at the end',
      thNpv: 'NPV at {rate}',
      thNpvSub: 'discounted',
      thSheet: 'Balance sheet, end of year {y}',
      thSheetDay: 'Balance sheet, day one',
      thAsset: 'asset',
      thLiab: 'liability',
      nothing: 'nothing',
      cashTitle: 'Cash paid so far, month by month',
      expTitle: 'Expense in each year',
      kDep: 'depreciation',
      kInt: 'interest',
      kRent: 'rent',
      yearN: 'year {n}',
      endOfYear: 'end of year {n}',
      eur: '€{n}',
      pct: '{n}%',
      nameCash: 'buying for cash',
      nameLoan: 'buying on a loan',
      nameLease: 'leasing',
      and2: '{a} and {b}',
      all3: 'all three ways',
      capSame: 'Least cash paid and also the highest NPV at the cost of capital ({rate}): {who}.',
      capDiffer: 'Least cash paid: {nom}. Highest NPV at the cost of capital ({rate}): {val}.',
      nBuyout: 'Buying out pays {r} more at the end, but the server worth {v} stays: the lease\'s NPV is the same as returning it.',
      nExtend: 'Extending pays 12 more rentals ({x}); a bought server needs no more cash, and is worth {v} by then.',
      nLoanCoc: 'The loan at {loan} moves the cash, not the value: discounted at the same cost of capital, its NPV equals paying cash.',
      nLoanCheap: 'The loan costs {loan} while money costs {coc}: paying over time beats paying cash, despite {i} of interest.',
      nRou: 'With the lease on the balance sheet, its expense in year {y} is {x} (depreciation and interest) against {r} of rentals: higher at first, lower later, as the interest falls.',
      nRouDay: 'On day one the lease puts {l} on both sides of the balance sheet: a right-of-use asset and a lease liability.',
      nRent: 'As rent the lease stays off the balance sheet, and its expense is the rentals: {r} a year.',
      illustrative: 'Amounts are made up but plausible; no taxes. Payments at the end of each month.',
      explain: '<p><b>One server, three ways to pay.</b> Buying for cash pays everything on day one. Buying on a loan ' +
        'pays monthly <i>instalments</i> with interest. A <i>lease</i> pays a monthly rental, and at the end the server ' +
        'goes back, is bought out at its <i>residual value</i>, or the lease is extended.</p>' +
        '<p><b>Cash, expense and the balance sheet are not the same.</b> A bought server is an <i>asset</i>: it reaches ' +
        'the expense through <i>depreciation</i>, and a loan is a <i>liability</i> on the balance sheet whose interest is ' +
        'an expense. Under the international standard (IFRS 16) a lease is on the balance sheet too: a ' +
        '<i>right-of-use asset</i> and a <i>lease liability</i>; its expense is then depreciation and interest, higher ' +
        'at the start. Booked as rent, the lease is just the rental expense, the same every year; IFRS 16 allows that only for short leases (up to 12 months) and low-value items, older and some national standards more widely. Either way, cash paid ' +
        'equals the expense plus the change in assets minus the change in liabilities.</p>' +
        '<p><b>Only the discounted comparison is fair.</b> Adding up the cash paid ignores <i>when</i> it is paid and ' +
        'what is left at the end. The <i>net present value</i> (NPV) discounts each payment at the <i>cost of ' +
        'capital</i> and adds the value of a server that is still owned. The cost of capital here is what the firm\'s own money earns elsewhere: a loan cheaper than that beats cash only ' +
        'if that is really so. A loan at a rate equal to the cost of capital ' +
        'has the same NPV as cash: it moves the cash, not the value. Buying out at the residual value does not change ' +
        'the NPV either: it pays what the server is worth.</p>' +
        '<p><b>Assumptions.</b> The server\'s value falls evenly to the residual value and on at the same pace; a bought ' +
        'server is written down along that line. With an extension all three ways are compared a year longer. ' +
        'Textbooks often discount a lease at the borrowing rate, because a lease resembles a loan: set the cost of ' +
        'capital equal to the loan rate to see that comparison.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
