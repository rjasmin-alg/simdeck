/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of fin-budget-variance, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   The title and subtitle come from sim.json. Numbers and month names are formatted in the page (index.html) and
   passed in; signed amounts carry their own + or −. Month lists are one string split on "|" (an array would be read
   as plural forms). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Plan i knjiženo ostvarenje po mjesecima, odstupanje od početka godine po dijelovima i prognoza za kraj godine',
      monthsShort: 'sij.|velj.|ožu.|tra.|svi.|lip.|srp.|kol.|ruj.|lis.|stu.|pro.',
      monthsLong: 'siječanj|veljača|ožujak|travanj|svibanj|lipanj|srpanj|kolovoz|rujan|listopad|studeni|prosinac',
      monthsLoc: 'siječnju|veljači|ožujku|travnju|svibnju|lipnju|srpnju|kolovozu|rujnu|listopadu|studenom|prosincu',
      nMonths: ['{n} mjesec', '{n} mjeseca', '{n} mjeseci'],
      eur: '{n}\u00a0€',
      // params
      pVolume: 'Više oblaka (od 5. mj.)',
      pPrice: 'Skuplje licence (od 7. mj.)',
      pLate: 'Račun kasni (10. mj.)',
      pAccrue: 'Obračunaj trošak bez računa',
      pSpend: 'Iskoristi ili izgubi',
      fy: 'Prvi mjesec poslovne godine',
      // presets
      prAll: 'Sva tri dijela',
      prAllHint: 'Veća potrošnja, skuplje licence i račun koji kasni, od početka godine.',
      prReal: 'Količina i cijena',
      prRealHint: 'Veća potrošnja i skuplje licence, bez računa koji kasni: stvarno prekoračenje koje tempo zadnjeg mjeseca dobro predviđa.',
      prLate: 'Račun kasni',
      prLateHint: '„Ispod plana u listopadu”: račun koji još nije stigao.',
      prUseIt: 'Iskoristi ili izgubi',
      prUseItHint: 'Prividna ušteda iz listopada potroši se u studenom, a onda stigne račun.',
      prAccrued: 'Obračunato',
      prAccruedHint: 'Veća potrošnja, skuplje licence i račun koji kasni, ali obračunat: ostaju samo količina i cijena.',
      // legend
      legCloud: 'oblak (knjiženo)',
      legLic: 'licence (knjiženo)',
      legBudget: 'plan za mjesec',
      legMissing: 'korišteno, bez računa',
      legAccrual: 'obračunato (procjena)',
      legForecast: 'prognoza (tempo zadnjeg mjeseca)',
      // stage
      chartTitle: 'Po mjesecima: plan i knjiženo',
      lCloud: 'Oblak',
      lLic: 'Licence',
      bridgeTitle: 'Odstupanje od početka godine',
      fromTo: 'Od početka godine: plan {bud} → knjiženo {act}',
      bVol: 'Količina',
      bVolSub: 'više potrošeno',
      bPrice: 'Cijena',
      bPriceSub: 'skuplje po jedinici',
      bTiming: 'Vrijeme',
      bTimingSub: 'račun u drugom mjesecu',
      bTotal: 'Ukupno',
      fcTitle: 'Prognoza za kraj godine',
      fcBudget: 'Plan za godinu',
      fcForecast: 'Prognoza',
      fcRule: '{done} dosad + {rate} × {k}',
      fcNone: 'Prije prvog mjeseca prognoza je sam plan.',
      fcFinal: 'Godina je zaključena: prognoza je ostvarenje.',
      wOver: 'iznad plana',
      wUnder: 'ispod plana',
      wOn: 'točno po planu',
      illustrative: 'Iznosi su izmišljeni, ali uvjerljivi. Izvještaj knjiži račune, a ne plaćanja.',
      // captions
      cStart: 'Plan za godinu je postavljen: {mb} mjesečno, {yb} za godinu. Svaki korak knjiži jedan mjesec: račune koji su stigli, nasuprot planu za taj mjesec.',
      cOnPlan: '{month}: svaki račun odgovara planu; mjesec je točno po planu.',
      cOver: '{month}: mjesec je {x} iznad plana.',
      cUnder: '{month}: mjesec je {x} ispod plana.',
      cVolume: '{month}: potrošnja oblaka raste na {qty} jedinica mjesečno. Po planiranoj cijeni to je {x} više svaki mjesec: odstupanje količine. Tempo zadnjeg mjeseca nosi to do kraja godine: prognoza {fc}.',
      cPrice: '{month}: licence se obnavljaju po cijeni od {price} po korisniku umjesto {bp}. Isti korisnici koštaju {x} više mjesečno: odstupanje cijene. Prognoza {fc}.',
      cMissing: '{month}: račun za oblak nije stigao. Mjesec izgleda {x} ispod plana, a iskorišteno je {miss} usluge bez računa: to je vremensko odstupanje, ne ušteda. Tempo ovog mjeseca predviđa samo {fc}.',
      cAccrual: '{month}: račun za oblak nije stigao, pa se njegova procjena, {miss}, obračunava. Mjesec pokazuje ono što je korišteno; vremenskog odstupanja nema, a prognoza ostaje {fc}.',
      cArrives: '{month}: zakašnjeli račun stiže s ovomjesečnim, dva računa za oblak u istom mjesecu. Vremensko odstupanje vraća se na 0, ali tempo od {rate} mjesečno sada predviđa {fc}.',
      cReplace: '{month}: zakašnjeli račun stiže i zamjenjuje obračunatu procjenu; mjesec knjiži samo vlastitu potrošnju.',
      cSpend: '{month}: u {m10} je godina od početka izgledala {s} ispod plana, pa se prije kraja godine kupi još {s} kapaciteta u oblaku: iskoristi ili izgubi. Stiže i zakašnjeli račun.',
      cNoSpend: '{month}: u {m10} godina od početka nije bila ispod plana, pa nema što potrošiti; ništa se dodatno ne kupuje.',
      cYearOver: 'Kraj godine: knjiženo {act} uz plan od {bud}, {x} iznad plana. Količina {vol}, cijena {prc}, vrijeme {tim}.',
      cYearUnder: 'Kraj godine: knjiženo {act} uz plan od {bud}, {x} ispod plana. Količina {vol}, cijena {prc}, vrijeme {tim}.',
      cYearOn: 'Kraj godine: knjiženo {act}, točno koliko je planirano.',
      gYearLate: 'Zakašnjeli račun samo je premjestio trošak iz jednog mjeseca u drugi: preko godine vremensko je odstupanje 0.',
      gOver: 'Od početka godine {d} iznad plana: količina {vol}, cijena {prc}, vrijeme {tim}.',
      gUnder: 'Od početka godine {d} ispod plana: količina {vol}, cijena {prc}, vrijeme {tim}.',
      gOn: 'Od početka godine točno po planu.',
      gEven: 'Od početka godine po planu samo zato što se dijelovi poništavaju: količina {vol}, cijena {prc}, vrijeme {tim}.',
      explain: '<p><b>Plan (engl. <i lang="en">budget</i>) je raspoređen po mjesecima, a svaki mjesec izvještaj ' +
        'uspoređuje plan s knjiženim ostvarenjem (engl. <i lang="en">actuals</i>).</b> Razlika je ' +
        '<i>odstupanje</i> (engl. <i lang="en">variance</i>): iznad plana ili ispod plana. Samo po sebi odstupanje ne ' +
        'kaže zašto; zato se rastavlja na dijelove.</p>' +
        '<p><b>Količina</b> (engl. <i lang="en">volume variance</i>): potrošeno više ili manje nego što je planirano, ' +
        'vrednovano po planiranoj cijeni. <b>Cijena</b> (engl. <i lang="en">price variance</i>): svaka jedinica ' +
        'skuplja ili jeftinija od plana, na stvarnoj količini. Ta dva dijela zajedno daju razliku između troška ' +
        'mjeseca i plana. <b>Vrijeme</b> (engl. <i lang="en">timing variance</i>): račun knjižen u drugom mjesecu od ' +
        'usluge koju plaća. Kasni račun čini mjesec „ispod plana”, a idući „iznad”; preko godine se poništi.</p>' +
        '<p><b>„Ispod plana u listopadu” često je samo račun koji nije stigao.</b> Ako se na kraju mjeseca ' +
        '<i>obračuna</i> procjena za korištenu uslugu bez računa (obračunati trošak, pasivno vremensko razgraničenje), ' +
        'izvještaj pokazuje potrošnju, a ne datum dolaska računa. To je isto načelo kao u simulatoru o vremenskim razgraničenjima.</p>' +
        '<p><b>Prognoza prema tempu zadnjeg mjeseca</b> (engl. <i lang="en">run rate</i>): knjiženo dosad plus posljednji ' +
        'mjesec pomnožen s brojem preostalih mjeseci. Jednostavna je i brzo hvata trajnu promjenu količine ili cijene, ' +
        'ali nosi i pogrešku tog jednog mjeseca: mjesec bez računa ili s dva računa daje prenisku ili previsoku prognozu.</p>' +
        '<p><b>Iskoristi ili izgubi.</b> Kad neiskorišteni plan na kraju godine propada, prividna ušteda potiče kupnju u ' +
        'zadnjim mjesecima. Ako je „ušteda” bila samo račun koji kasni, godina završi iznad plana.</p>' +
        '<p>Plan je ovdje jednak svaki mjesec; stvarni planovi često prate sezonu ili projekte. Iznosi su izmišljeni, ' +
        'ali uvjerljivi.</p>'
    },
    en: {
      stage: 'Budget and booked actuals by month, the variance to date by part, and the year-end forecast',
      monthsShort: 'Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec',
      monthsLong: 'January|February|March|April|May|June|July|August|September|October|November|December',
      monthsLoc: 'January|February|March|April|May|June|July|August|September|October|November|December',
      nMonths: ['{n} month', '{n} months'],
      eur: '€{n}',
      pVolume: 'More cloud use (from month 5)',
      pPrice: 'Dearer licences (from month 7)',
      pLate: 'Late invoice (month 10)',
      pAccrue: 'Accrue the missing invoice',
      pSpend: 'Use it or lose it',
      fy: 'First month of the fiscal year',
      prAll: 'All three parts',
      prAllHint: 'More use, dearer licences and a late invoice, from the start of the year.',
      prReal: 'Volume and price',
      prRealHint: 'More use and dearer licences, no late invoice: a real overspend the run rate forecasts well.',
      prLate: 'Late invoice',
      prLateHint: '"Under budget in October": an invoice that has not arrived.',
      prUseIt: 'Use it or lose it',
      prUseItHint: 'October\'s apparent saving is spent in November, then the invoice arrives.',
      prAccrued: 'Accrued',
      prAccruedHint: 'More use, dearer licences and the late invoice, but accrued: only volume and price remain.',
      legCloud: 'cloud (booked)',
      legLic: 'licences (booked)',
      legBudget: 'budget for the month',
      legMissing: 'used, not invoiced',
      legAccrual: 'accrued (estimate)',
      legForecast: 'forecast (run rate)',
      chartTitle: 'Month by month: budget and booked',
      lCloud: 'Cloud',
      lLic: 'Licences',
      bridgeTitle: 'Variance to date',
      fromTo: 'Budget to date {bud} → booked to date {act}',
      bVol: 'Volume',
      bVolSub: 'more used',
      bPrice: 'Price',
      bPriceSub: 'dearer per unit',
      bTiming: 'Timing',
      bTimingSub: 'invoice in another month',
      bTotal: 'Total',
      fcTitle: 'Year-end forecast',
      fcBudget: 'Budget for the year',
      fcForecast: 'Forecast',
      fcRule: '{done} to date + {rate} × {k}',
      fcNone: 'Before the first month the forecast is the budget itself.',
      fcFinal: 'The year is closed: the forecast is the actual.',
      wOver: 'over budget',
      wUnder: 'under budget',
      wOn: 'on budget',
      illustrative: 'Amounts are made up but plausible. The report books invoices, not payments.',
      cStart: 'The year\'s budget is set: {mb} a month, {yb} for the year. Each step books one month: the invoices that arrived, against that month\'s budget.',
      cOnPlan: '{month}: every invoice matches its budget; the month is on budget.',
      cOver: '{month}: the month is {x} over budget.',
      cUnder: '{month}: the month is {x} under budget.',
      cVolume: '{month}: cloud use rises to {qty} units a month. At the budgeted price that is {x} more every month: a volume variance. The run rate carries it to year end: forecast {fc}.',
      cPrice: '{month}: the licences renew at {price} a seat instead of {bp}. The same seats cost {x} more a month: a price variance. Forecast {fc}.',
      cMissing: '{month}: the cloud invoice has not arrived. The month looks {x} under budget, yet {miss} of service was used without an invoice: a timing variance, not a saving. This month\'s run rate forecasts only {fc}.',
      cAccrual: '{month}: the cloud invoice has not arrived, so its estimate, {miss}, is accrued. The month shows what was used; there is no timing variance and the forecast stays at {fc}.',
      cArrives: '{month}: the late invoice arrives with this month\'s, two cloud invoices in one month. The timing variance is back to 0, but the run rate of {rate} now forecasts {fc}.',
      cReplace: '{month}: the late invoice arrives and replaces the accrued estimate; the month books only its own use.',
      cSpend: '{month}: at the end of {m10} the year to date looked {s} under budget, so {s} more cloud capacity is bought before the year ends: use it or lose it. The late invoice arrives as well.',
      cNoSpend: '{month}: at the end of {m10} the year to date was not under budget, so there is nothing to spend; nothing extra is bought.',
      cYearOver: 'Year end: {act} booked against a budget of {bud}, {x} over. Volume {vol}, price {prc}, timing {tim}.',
      cYearUnder: 'Year end: {act} booked against a budget of {bud}, {x} under. Volume {vol}, price {prc}, timing {tim}.',
      cYearOn: 'Year end: {act} booked, exactly the budget.',
      gYearLate: 'The late invoice only moved cost from one month to the next: over the year its timing variance is 0.',
      gOver: 'To date {d} over budget: volume {vol}, price {prc}, timing {tim}.',
      gUnder: 'To date {d} under budget: volume {vol}, price {prc}, timing {tim}.',
      gOn: 'To date exactly on budget.',
      gEven: 'To date on budget only because the parts cancel: volume {vol}, price {prc}, timing {tim}.',
      explain: '<p><b>A budget is phased by month, and each month a report compares it with the actuals booked.</b> ' +
        'The difference is the <i>variance</i>: over budget or under budget. On its own a variance does not say why, ' +
        'so it is split into parts.</p>' +
        '<p><b>Volume</b>: more or less used than budgeted, valued at the budgeted price. <b>Price</b>: each unit ' +
        'dearer or cheaper than budgeted, on the quantity actually used. Together these two make the difference ' +
        'between the month\'s expense and its budget. <b>Timing</b>: an invoice booked in another month than the ' +
        'service it pays for. A late invoice makes one month "under budget" and the next "over"; over the year it ' +
        'cancels out.</p>' +
        '<p><b>"Under budget in October" is often just an invoice that has not arrived.</b> If the service used ' +
        'without an invoice is <i>accrued</i> at month end (an accrued expense, booked by estimate), the report shows ' +
        'consumption, not when the invoice happened to arrive. It is the same principle as in the accruals simulator.</p>' +
        '<p><b>The run-rate forecast</b>: booked to date plus the latest month times the months left. It is simple and ' +
        'catches a lasting change in volume or price quickly, but it also carries that one month\'s error: a month ' +
        'with no invoice, or with two, gives a forecast far too low or too high.</p>' +
        '<p><b>Use it or lose it.</b> Where unspent budget lapses at year end, an apparent saving invites buying in ' +
        'the last months. If the "saving" was only a late invoice, the year ends over budget.</p>' +
        '<p>The budget here is the same every month; real budgets often follow seasons or projects. Amounts are made ' +
        'up but plausible.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
