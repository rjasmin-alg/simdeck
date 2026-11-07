/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of fin-depreciation, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   The title and subtitle come from sim.json. Numbers are formatted in the page (index.html) and passed in.
   {dep} / {Dep}: "depreciation" for equipment, "amortisation" for a licence (one word in Croatian, amortizacija). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Ista imovina, dvije metode amortizacije: amortizacija po godinama, knjigovodstvena vrijednost i prodaja',
      sell: 'Prodaja ili rashodovanje',
      sellFmt: 'kraj {n}. godine',
      sellEnd: 'kraj {n}. godine (kraj vijeka)',
      proceeds: 'Primljeno od prodaje',
      proceedsHint: '0 € = rashodovana bez naknade.',
      cost: 'Nabavna vrijednost',
      life: 'Vijek uporabe',
      residual: 'Ostatak vrijednosti',
      kind: 'Kupljeno:',
      kindEquipment: 'Oprema',
      kindLicence: 'Trajna licenca',
      nYears: ['{n} godina', '{n} godine', '{n} godina'],
      wDep: 'amortizacija',
      wDepCap: 'Amortizacija',
      wAmort: 'amortizacija',
      wAmortCap: 'Amortizacija',
      pServer: 'Poslužitelj do kraja vijeka',
      pServerHint: '30 000 €, pet godina, ostatak 3 000 €: dva oblika, isti kraj.',
      pSoldEarly: 'Prodan ranije',
      pSoldEarlyHint: 'Prodan nakon tri godine za 10 000 €: jednom metodom gubitak, drugom dobitak.',
      pScrapped: 'Rashodovan ranije',
      pScrappedHint: 'Rashodovan nakon tri godine bez naknade: preostala knjigovodstvena vrijednost ide u otpis.',
      pLicence: 'Trajna licenca',
      pLicenceHint: 'Licenca od 24 000 € na četiri godine, bez ostatka vrijednosti, zamijenjena nakon dvije: amortizira se i otpisuje jednako kao oprema.',
      legDep: 'amortizacija u godini',
      legBook: 'knjigovodstvena vrijednost na kraju godine',
      legResidual: 'ostatak vrijednosti',
      legSale: 'prodaja (◆ primljeno)',
      legLoss: '▼ gubitak od prodaje',
      legGain: '▲ dobitak od prodaje',
      legPlan: 'plan da je zadržana',
      legChanged: 'ishod se promijenio',
      slTitle: 'Linearna',
      dbTitle: 'Degresivna',
      slLine: '{x} svake godine = ({cost} − {res}) ÷ {life}',
      dbLine: '{pct} knjigovodstvene vrijednosti svake godine, nikad ispod ostatka vrijednosti',
      dbLineSw: '{pct} knjigovodstvene vrijednosti svake godine; od {k}. godine preostali iznos jednoliko',
      chLoss: '▼ gubitak {x}',
      chGain: '▲ dobitak {x}',
      chNone: '= ni dobitak ni gubitak',
      chSold: 'prodano',
      chScrapped: 'rashodovano',
      yearN: '{n}. god.',
      rowDepN: '{Dep}, 1.–{n}. godina',
      rowDep1: '{Dep}, 1. godina',
      rowBook: 'Knjigovodstvena vrijednost na kraju {n}. godine',
      rowProceeds: 'Primljeno od prodaje',
      rowLoss: 'Gubitak od prodaje',
      rowWriteOff: 'Otpis (gubitak)',
      rowGain: 'Dobitak od prodaje',
      rowNone: 'Ni dobitka ni gubitka',
      rowTotal: 'Ukupno u trošku = nabavna vrijednost − primljeno',
      eur: '{n}\u00a0€',
      endSold: 'Imovina je korištena do kraja vijeka uporabe ({life}) i prodana za {p}.',
      endScrapped: 'Imovina je korištena do kraja vijeka uporabe ({life}) i rashodovana bez naknade.',
      earlySold: 'Imovina je prodana na kraju {n}. godine (vijek uporabe {life}) za {p}.',
      earlyScrapped: 'Imovina je rashodovana na kraju {n}. godine (vijek uporabe {life}) bez naknade.',
      slLoss: 'Linearno: knjigovodstvena vrijednost {b}, dakle gubitak od {x}.',
      slGain: 'Linearno: knjigovodstvena vrijednost {b}, dakle dobitak od {x}.',
      slNone: 'Linearno: knjigovodstvena vrijednost {b}, jednako primljenom: ni dobitka ni gubitka.',
      dbLoss: 'Degresivno: knjigovodstvena vrijednost {b}, dakle gubitak od {x}.',
      dbGain: 'Degresivno: knjigovodstvena vrijednost {b}, dakle dobitak od {x}.',
      dbNone: 'Degresivno: knjigovodstvena vrijednost {b}, jednako primljenom: ni dobitka ni gubitka.',
      bothLoss: 'Obje metode daju knjigovodstvenu vrijednost {b}, dakle gubitak od {x} u obje.',
      bothGain: 'Obje metode daju knjigovodstvenu vrijednost {b}, dakle dobitak od {x} u obje.',
      bothNone: 'Obje metode daju knjigovodstvenu vrijednost {b}: ni dobitka ni gubitka.',
      nFlip: 'Ista prodaja jednom je metodom gubitak, a drugom dobitak, a ipak je u oba slučaja ukupno {t} u trošku: nabavna vrijednost minus primljeno.',
      nTotal: 'U oba slučaja ukupno je {t} u trošku, nabavna vrijednost minus primljeno: metoda samo seli trošak između godina.',
      nYear1: 'U oba slučaja ukupno je {t} u trošku; od toga degresivna u 1. godinu stavlja {a}, linearna {b}.',
      illustrative: 'Iznosi su izmišljeni, ali uvjerljivi. Kupljeno prvog dana 1. godine; puna godišnja amortizacija do prodaje.',
      footLicence: 'Trajna licenca je nematerijalna imovina: amortizira se jednako kao oprema, obično bez ostatka vrijednosti.',
      explain: '<p><b>Amortizacija raspoređuje trošak, ne mjeri cijenu na tržištu.</b> Kupljena oprema ide u ' +
        '<i>bilancu</i> po <i>nabavnoj vrijednosti</i>, a zatim se kroz <i>vijek uporabe</i> svake godine dio prenosi u ' +
        'trošak kao <i>amortizacija</i> (engl. <i lang="en">depreciation</i>). Ono što ostane je <i>knjigovodstvena ' +
        'vrijednost</i>. Na kraju vijeka ostaje <i>ostatak vrijednosti</i> (engl. <i lang="en">residual value</i>), ' +
        'ono što se očekuje dobiti prodajom.</p>' +
        '<p><b>Linearna</b> metoda (engl. <i lang="en">straight-line</i>) svake godine prenosi isti iznos: (nabavna ' +
        'vrijednost − ostatak) ÷ vijek. <b>Degresivna</b> metoda (engl. <i lang="en">declining balance</i>) svake ' +
        'godine prenosi isti postotak preostale knjigovodstvene vrijednosti, ovdje dvostruku linearnu stopu (2 ÷ vijek), ' +
        'pa je trošak velik u prvim godinama i sve manji poslije. Kad jednoliko raspoređivanje preostalog iznosa dade više, ' +
        'prelazi se na linearnu, a ispod ostatka vrijednosti se nikad ne ide. Metodu bira poduzeće prema tome kako ' +
        'imovina gubi korisnost; računalna oprema često najbrže na početku. Pravila daje MRS 16 (engl. IAS 16).</p>' +
        '<p><b>Isti zbroj.</b> Kojom god metodom, do prodaje ukupno u trošak ode nabavna vrijednost minus ono što je ' +
        'primljeno od prodaje: to je i novac koji je stvarno izašao. Metoda mijenja samo godine u kojima trošak ' +
        'nastaje.</p>' +
        '<p><b>Prodaja ili rashodovanje prije kraja.</b> Na dan prodaje imovina izlazi iz bilance. Razlika između ' +
        'primljenog i knjigovodstvene vrijednosti je <i>dobitak</i> ili <i>gubitak od prodaje</i>; bez naknade cijela ' +
        'knjigovodstvena vrijednost ide u <i>otpis</i>. Dobitak ne znači da se na poslužitelju zaradilo: znači samo da ' +
        'je amortizacija bila brža od pada cijene. Zato ista prodaja uz degresivnu metodu može biti dobitak, a uz ' +
        'linearnu gubitak.</p>' +
        '<p><b>Softver.</b> Trajna licenca je <i>nematerijalna imovina</i> i amortizira se na isti način (MRS 38, engl. ' +
        'IAS 38), obično bez ostatka vrijednosti. Hrvatski za oboje kaže amortizacija; engleski za opremu kaže ' +
        '<i lang="en">depreciation</i>, a za nematerijalnu imovinu <i lang="en">amortisation</i>.</p>' +
        '<p>Ovdje se amortizira u punim godinama; poduzeća često računaju po mjesecima od dana kupnje do dana prodaje.</p>'
    },
    en: {
      stage: 'One asset, two depreciation methods: depreciation by year, book value and the sale',
      sell: 'Sold or retired',
      sellFmt: 'end of year {n}',
      sellEnd: 'end of year {n} (end of life)',
      proceeds: 'Sale proceeds',
      proceedsHint: '€0 = retired with nothing back.',
      cost: 'Cost',
      life: 'Useful life',
      residual: 'Residual value',
      kind: 'Bought:',
      kindEquipment: 'Equipment',
      kindLicence: 'Perpetual licence',
      nYears: ['{n} year', '{n} years'],
      wDep: 'depreciation',
      wDepCap: 'Depreciation',
      wAmort: 'amortisation',
      wAmortCap: 'Amortisation',
      pServer: 'Server, kept to the end',
      pServerHint: '€30,000, five years, residual €3,000: two shapes, the same end.',
      pSoldEarly: 'Sold early',
      pSoldEarlyHint: 'Sold after three years for €10,000: a loss one way, a gain the other.',
      pScrapped: 'Retired early',
      pScrappedHint: 'Retired after three years with nothing back: the book value is written off.',
      pLicence: 'Perpetual licence',
      pLicenceHint: 'A €24,000 licence over four years, no residual, replaced after two: amortised and written off the same way as equipment.',
      legDep: 'depreciation in the year',
      legBook: 'book value at the year end',
      legResidual: 'residual value',
      legSale: 'the sale (◆ proceeds)',
      legLoss: '▼ loss on the sale',
      legGain: '▲ gain on the sale',
      legPlan: 'the plan had it been kept',
      legChanged: 'the outcome changed',
      slTitle: 'Straight-line',
      dbTitle: 'Declining balance',
      slLine: '{x} every year = ({cost} − {res}) ÷ {life}',
      dbLine: '{pct} of the book value every year, never below the residual value',
      dbLineSw: '{pct} of the book value every year; from year {k} the rest evenly',
      chLoss: '▼ loss {x}',
      chGain: '▲ gain {x}',
      chNone: '= no gain or loss',
      chSold: 'sold',
      chScrapped: 'retired',
      yearN: 'year {n}',
      rowDepN: '{Dep}, years 1–{n}',
      rowDep1: '{Dep}, year 1',
      rowBook: 'Book value at the end of year {n}',
      rowProceeds: 'Sale proceeds',
      rowLoss: 'Loss on the sale',
      rowWriteOff: 'Written off (loss)',
      rowGain: 'Gain on the sale',
      rowNone: 'Neither gain nor loss',
      rowTotal: 'Expensed in total = cost − proceeds',
      eur: '€{n}',
      endSold: 'Used to the end of its useful life ({life}) and sold for {p}.',
      endScrapped: 'Used to the end of its useful life ({life}) and retired with nothing back.',
      earlySold: 'Sold at the end of year {n} (useful life {life}) for {p}.',
      earlyScrapped: 'Retired at the end of year {n} (useful life {life}) with nothing back.',
      slLoss: 'Straight-line: book value {b}, so a loss of {x}.',
      slGain: 'Straight-line: book value {b}, so a gain of {x}.',
      slNone: 'Straight-line: book value {b}, equal to the proceeds: no gain or loss.',
      dbLoss: 'Declining balance: book value {b}, so a loss of {x}.',
      dbGain: 'Declining balance: book value {b}, so a gain of {x}.',
      dbNone: 'Declining balance: book value {b}, equal to the proceeds: no gain or loss.',
      bothLoss: 'Both methods give a book value of {b}, so a loss of {x} either way.',
      bothGain: 'Both methods give a book value of {b}, so a gain of {x} either way.',
      bothNone: 'Both methods give a book value of {b}: no gain or loss.',
      nFlip: 'The same sale is a loss one way and a gain the other, yet either way {t} is expensed in total: the cost minus the proceeds.',
      nTotal: 'Either way {t} is expensed in total, the cost minus the proceeds: the method only moves the expense between years.',
      nYear1: 'Either way {t} is expensed in total; declining balance puts {a} of it in year 1, straight-line {b}.',
      illustrative: 'The amounts are made up but plausible. Bought on the first day of year 1; a full year of depreciation every year until the sale.',
      footLicence: 'A perpetual licence is an intangible asset: amortised exactly as equipment is depreciated, usually with no residual value.',
      explain: '<p><b>Depreciation spreads a cost; it does not track a market price.</b> Bought equipment goes on the ' +
        '<i>balance sheet</i> at its <i>cost</i>, and over its <i>useful life</i> a part moves to the expense each year ' +
        'as <i>depreciation</i>. What is left is the <i>book value</i>. At the end of the life the <i>residual value</i> ' +
        'remains: what the asset is expected to fetch then.</p>' +
        '<p><b>Straight-line</b> moves the same amount every year: (cost − residual) ÷ life. <b>Declining balance</b> ' +
        'moves the same percentage of the remaining book value every year, here double the straight-line rate (2 ÷ ' +
        'life), so the expense is large in the first years and shrinks after. Once spreading what is left evenly gives ' +
        'more, it switches to straight-line, and it never goes below the residual value. A company chooses the method ' +
        'that matches how the asset\'s benefits are used up; computer equipment often loses it fastest early on. The ' +
        'rules are in IAS 16.</p>' +
        '<p><b>The same total.</b> Whatever the method, by the sale the expense adds up to the cost minus what the sale ' +
        'brought in: the cash that actually left. The method only changes the years in which the expense falls.</p>' +
        '<p><b>Selling or retiring early.</b> On the day of the sale the asset leaves the balance sheet. The proceeds ' +
        'minus the book value is a <i>gain</i> or a <i>loss on the sale</i>; with nothing back the whole book value is ' +
        '<i>written off</i>. A gain does not mean the server made money: only that depreciation ran faster than the ' +
        'price fell. That is why the same sale can be a gain under declining balance and a loss under straight-line.</p>' +
        '<p><b>Software.</b> A perpetual licence is an <i>intangible asset</i> and is amortised the same way (IAS 38), ' +
        'usually with no residual value. English says <i>depreciation</i> for equipment and <i>amortisation</i> for ' +
        'intangibles; Croatian says amortizacija for both.</p>' +
        '<p>Here depreciation runs in whole years; companies often count months from the day of purchase to the day of ' +
        'sale.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
