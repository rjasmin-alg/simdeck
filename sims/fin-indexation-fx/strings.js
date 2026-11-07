/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of fin-indexation-fx, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   The title and subtitle come from sim.json. Numbers are formatted in the page (index.html) and passed in. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Petogodišnji ugovor: plaćeni i realni euri za svaku godinu, po vrsti cijene',
      clause: 'Cijena u ugovoru',
      clauseFixed: 'Fiksna cijena',
      clauseIndexed: 'Indeksirana cijena',
      clauseCapped: 'Indeksacija s granicama',
      subFixed: '{p} godišnje, pet godina isto',
      subIndexed: 'svake godine prati indeks cijena',
      subCapped: 'prati indeks, ali godišnje između {f} i {c}',
      cur: 'Valuta cijene',
      curEur: 'euro (€)',
      curUsd: 'dolar (USD)',
      infl: 'Kretanje inflacije',
      inflSteady: 'stabilna',
      inflSpike: 'skok',
      inflLow: 'niska',
      fx: 'Kretanje tečaja',
      fxFlat: 'stalan',
      fxEurWeak: 'euro slabi',
      fxEurStrong: 'euro jača',
      fxSwings: 'koleba se',
      premium: 'Premija za fiksnu cijenu',
      cap: 'Gornja granica godišnjeg rasta',
      floor: 'Donja granica godišnje promjene',
      pFixedSteady: 'Fiksna cijena, stabilna inflacija',
      pFixedSteadyHint: 'Cijena ostaje ista, a njezina realna vrijednost pada; premija od 4 % pokriva otprilike 2 % inflacije godišnje.',
      pIndexedSpike: 'Indeksirana, skok inflacije',
      pIndexedSpikeHint: 'Indeksacija prenosi skok na kupca: realna cijena ostaje ista, plaća se sve više.',
      pCappedSpike: 'Gornja granica 3 %, skok inflacije',
      pCappedSpikeHint: 'Granica zadržava rast od 9 % i 6 %, a rast od točno 3 % prolazi.',
      pFloorLow: 'Donja granica 0 %, niska inflacija',
      pFloorLowHint: 'Kad cijene padnu za 1 %, indeksirana cijena pada, a donja granica je drži.',
      pUsdEuroWeak: 'Fiksno u dolarima, euro slabi',
      pUsdEuroWeakHint: 'Ista cijena u dolarima svake je godine skuplja u eurima.',
      pUsdEuroStrong: 'Fiksno u dolarima, euro jača',
      pUsdEuroStrongHint: 'Tečaj može i pomoći: ovaj put euro jača, pa kupac plaća manje.',
      legNominal: 'plaćeno (nominalni euri)',
      legReal: 'vrijedi (euri s dana potpisa)',
      legSigning: 'cijena pri potpisu, {x}',
      thClause: 'Cijena u ugovoru',
      thNominal: 'Plaćeno ukupno',
      thNominalSub: 'nominalni euri',
      thReal: 'Vrijedi pri potpisu',
      thRealSub: 'realni euri',
      thLast: '5. godina',
      thLastSub: 'plaćeno · vrijedi',
      cheapest: 'najmanje za kupca',
      chartTitle: 'Svaka godišnja uplata: plaćeno i koliko vrijedi',
      chartNote: 'realni euri = plaćeno ÷ razina cijena (pri potpisu 100)',
      yearN: '{n}. godina',
      levelN: 'cijene {l}',
      levelStart: 'cijene 100',
      fxN: '1 USD = {x} €',
      usd: '{n} USD',
      heldCap: 'gornja granica: {r}',
      heldFloor: 'donja granica: {r}',
      eur: '{n} €',
      pct: '{n} %',
      anniversariesN: ['{n} godišnjici', '{n} godišnjice', '{n} godišnjica'],
      capMain: '{clause}: ukupno se plaća {n}, a to vrijedi {r} u eurima s dana potpisa (po cijeni pri potpisu bilo bi {b}).',
      nFixed: 'Cijena ostaje {p} godišnje, ali inflacija joj jede realnu vrijednost: peta uplata vrijedi samo {r5}. Inflacija prenosi vrijednost s dobavljača na kupca; premija je dobavljačeva cijena tog rizika.',
      nFixedDearer: 'Cijena ostaje {p} godišnje i inflacija joj jede realnu vrijednost (peta uplata vrijedi {r5}), ali ovaj put premija je veća od inflacije: kupac realno plaća {d} više nego uz indeksaciju.',
      nFixedUsdFlat: 'Fiksno u dolarima ostaje fiksno u eurima samo dok tečaj stoji.',
      nFixedUsd: 'Fiksno u dolarima nije fiksno u eurima: godišnja uplata kreće se od {lo} do {hi}.',
      nIndexed: 'Indeksacija prenosi inflaciju: svaka uplata vrijedi {p} u eurima s dana potpisa, a inflaciju snosi kupac.',
      nIndexedUsd: 'Cijena u dolarima prati indeks, ali iznos u eurima prati i tečaj.',
      nCap: 'Na {k} rast je zadržala gornja granica: {d} u odnosu na punu indeksaciju.',
      nFloor: 'Na {j} promjenu je zadržala donja granica: {d} u odnosu na punu indeksaciju.',
      nCapFloor: 'Na {k} rast je zadržala gornja granica, na {j} promjenu donja: {d} u odnosu na punu indeksaciju.',
      nNoBound: 'Inflacija je ostala između granica: isto kao puna indeksacija.',
      nFxUp: 'Sam tečaj dodao je {x}.',
      nFxDown: 'Sam tečaj uštedio je {x}, ovaj put.',
      nFxNone: 'Tečaj se nije pomaknuo, pa valuta ništa nije dodala, ovaj put.',
      illustrative: 'Iznosi i kretanja su izmišljeni, ali uvjerljivi. Svaka se godina plaća na početku; cijena se mijenja na godišnjicu prema inflaciji protekle godine.',
      explain: '<p><b>Fiksna cijena gubi realnu vrijednost.</b> Uz inflaciju od 2 % godišnje 104 000 € u petoj ' +
        'godini kupuje koliko 96 080 € na dan potpisa. Iznos na računu je <i>nominalan</i>; podijeljen s razinom ' +
        'cijena postaje <i>realan</i>, u eurima s dana potpisa (engl. <i lang="en">real euros</i>). Kupac s ' +
        'fiksnom cijenom dobiva ono što dobavljač gubi, pa dobavljač za fiksnu cijenu traži premiju.</p>' +
        '<p><b>Klauzula o indeksaciji</b> (engl. <i lang="en">indexation clause</i>) na svaku godišnjicu mijenja ' +
        'cijenu za inflaciju protekle godine, mjerenu indeksom cijena koji ugovor navodi. Realna cijena tada ostaje ' +
        'ista, a rizik inflacije prelazi na kupca. Indeksacija vrijedi u oba smjera: kad cijene padnu, pada i ' +
        'cijena.</p>' +
        '<p><b>Gornja granica</b> (engl. <i lang="en">cap</i>) ograničava godišnji rast i štiti kupca od skoka ' +
        'inflacije; <b>donja granica</b> (engl. <i lang="en">floor</i>) određuje najmanju godišnju promjenu i štiti dobavljača. Između ' +
        'granica cijena prati indeks.</p>' +
        '<p><b>Cijena u stranoj valuti dodaje tečajni rizik</b> (engl. <i lang="en">exchange-rate risk</i>). ' +
        'Fiksna cijena u dolarima u eurima nije fiksna: svaka uplata plaća se po tečaju na dan uplate. Tečaj može ' +
        'pomoći ili odmoći; proračun u eurima ne zna unaprijed koliko. Ugovor u stranoj valuti obično se ' +
        'indeksira indeksom cijena te valute; ovdje oba indeksa prate isto kretanje, pa se vidi samo tečaj.</p>' +
        '<p>Koja je cijena najjeftinija, ovisi o kretanju koje se tek dogodi. Tablica gore uspoređuje sve tri na ' +
        'istom kretanju.</p>'
    },
    en: {
      stage: 'A five-year contract: euros paid and real euros for each year, by kind of price',
      clause: 'Price in the contract',
      clauseFixed: 'Fixed price',
      clauseIndexed: 'Indexed price',
      clauseCapped: 'Indexed with a cap and floor',
      subFixed: '{p} a year, the same for five years',
      subIndexed: 'follows the price index every year',
      subCapped: 'follows the index, but between {f} and {c} a year',
      cur: 'Currency of the price',
      curEur: 'euro (€)',
      curUsd: 'dollar (USD)',
      infl: 'Inflation path',
      inflSteady: 'steady',
      inflSpike: 'spike',
      inflLow: 'low',
      fx: 'Exchange-rate path',
      fxFlat: 'flat',
      fxEurWeak: 'euro weakens',
      fxEurStrong: 'euro strengthens',
      fxSwings: 'swings',
      premium: 'Fixed-price premium',
      cap: 'Cap on the yearly rise',
      floor: 'Floor on the yearly change',
      pFixedSteady: 'Fixed price, steady inflation',
      pFixedSteadyHint: 'The price stays the same and its real value falls; a 4% premium about covers 2% inflation a year.',
      pIndexedSpike: 'Indexed, an inflation spike',
      pIndexedSpikeHint: 'Indexation passes the spike on to the buyer: the real price stays, the euros paid climb.',
      pCappedSpike: 'A 3% cap, an inflation spike',
      pCappedSpikeHint: 'The cap holds the 9% and 6% rises, and a rise of exactly 3% passes.',
      pFloorLow: 'A 0% floor, low inflation',
      pFloorLowHint: 'When prices fall 1%, the indexed price falls, and the floor holds it.',
      pUsdEuroWeak: 'Fixed in dollars, the euro weakens',
      pUsdEuroWeakHint: 'The same dollar price costs more euros every year.',
      pUsdEuroStrong: 'Fixed in dollars, the euro strengthens',
      pUsdEuroStrongHint: 'The rate can help too: this time the euro strengthens and the buyer pays less.',
      legNominal: 'paid (nominal euros)',
      legReal: 'worth (signing-day euros)',
      legSigning: 'price at signing, {x}',
      thClause: 'Price in the contract',
      thNominal: 'Paid in total',
      thNominalSub: 'nominal euros',
      thReal: 'Worth at signing',
      thRealSub: 'real euros',
      thLast: 'Year 5',
      thLastSub: 'paid · worth',
      cheapest: 'least for the buyer',
      chartTitle: 'Each yearly payment: paid and what it is worth',
      chartNote: 'real euros = paid ÷ price level (100 at signing)',
      yearN: 'year {n}',
      levelN: 'prices {l}',
      levelStart: 'prices 100',
      fxN: '1 USD = €{x}',
      usd: 'USD {n}',
      heldCap: 'cap: {r}',
      heldFloor: 'floor: {r}',
      eur: '€{n}',
      pct: '{n}%',
      anniversariesN: ['{n} anniversary', '{n} anniversaries'],
      capMain: '{clause}: {n} paid in total, worth {r} in signing-day euros ({b} at the signing price).',
      nFixed: 'The price stays at {p} a year, but inflation eats its real value: the fifth payment is worth only {r5}. Inflation moves value from the vendor to the buyer; the premium is the vendor\'s price for that risk.',
      nFixedDearer: 'The price stays at {p} a year and inflation eats its real value (the fifth payment is worth {r5}), but this time the premium outweighs the inflation: in real terms the buyer pays {d} more than with indexation.',
      nFixedUsdFlat: 'Fixed in dollars stays fixed in euros only while the rate stays put.',
      nFixedUsd: 'Fixed in dollars is not fixed in euros: the yearly payment runs from {lo} to {hi}.',
      nIndexed: 'Indexation passes inflation on: every payment is worth {p} in signing-day euros, and the buyer carries the inflation.',
      nIndexedUsd: 'The dollar price follows the index, but the euro amount follows the exchange rate as well.',
      nCap: 'The cap held back the rise on {k}: {d} against full indexation.',
      nFloor: 'The floor held up the change on {j}: {d} against full indexation.',
      nCapFloor: 'The cap held back the rise on {k}, the floor held up the change on {j}: {d} against full indexation.',
      nNoBound: 'Inflation stayed between the bounds: the same as full indexation.',
      nFxUp: 'The exchange rate alone added {x}.',
      nFxDown: 'The exchange rate alone saved {x}, this time.',
      nFxNone: 'The exchange rate did not move, so the currency added nothing, this time.',
      illustrative: 'The amounts and paths are made up but plausible. Each year is paid at its start; the price changes at each anniversary by the past year\'s inflation.',
      explain: '<p><b>A fixed price loses real value.</b> At 2% inflation a year, €104,000 in year five buys what ' +
        '€96,080 bought on the signing day. The amount on the invoice is <i>nominal</i>; divided by the price ' +
        'level it becomes <i>real</i>, in signing-day euros. A buyer with a fixed price gains what the vendor ' +
        'loses, so the vendor asks a premium for a fixed price.</p>' +
        '<p><b>An indexation clause</b> changes the price at every anniversary by the past year\'s inflation, as ' +
        'measured by the price index the contract names. The real price then stays the same and the inflation ' +
        'risk moves to the buyer. Indexation works both ways: when prices fall, the price falls.</p>' +
        '<p><b>A cap</b> limits the yearly rise and protects the buyer from an inflation spike; <b>a floor</b> ' +
        'sets the smallest yearly change and protects the vendor. Between the two the price follows the index.</p>' +
        '<p><b>A price in a foreign currency adds exchange-rate risk.</b> A fixed price in dollars is not fixed ' +
        'in euros: each payment is made at the rate on its day. The rate can help or hurt; a budget in euros ' +
        'cannot know in advance by how much. A contract in a foreign currency is usually indexed to that ' +
        'currency\'s price index; here both indices follow the same path, so only the exchange rate differs.</p>' +
        '<p>Which price is cheapest depends on a path that has not happened yet. The table above compares all ' +
        'three on the same path.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
