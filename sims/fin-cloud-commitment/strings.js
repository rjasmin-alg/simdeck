/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of fin-cloud-commitment, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   The title and subtitle come from sim.json. Numbers are formatted in the page (index.html) and passed in. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Godina potrošnje, ugovorena razina i koliko košta: iskorišteno, neiskorišteno i po potrošnji',
      commit: 'Ugovorena razina',
      term: 'Razdoblje obveze',
      term1: '1 godina',
      term3: '3 godine',
      later: 'Potrošnja od 2. godine',
      best: 'Ugovori najbolju razinu',
      nServers: ['{n} poslužitelj', '{n} poslužitelja', '{n} poslužitelja'],
      ofServers: ['{n} poslužitelja', '{n} poslužitelja', '{n} poslužitelja'],
      overYears: ['kroz {n} godinu', 'kroz {n} godine', 'kroz {n} godina'],
      m1: 'sij', m2: 'velj', m3: 'ožu', m4: 'tra', m5: 'svi', m6: 'lip',
      m7: 'srp', m8: 'kol', m9: 'ruj', m10: 'lis', m11: 'stu', m12: 'pro',
      headYear1: '1. godina: poslužitelji u radu, mjesec po mjesec',
      headLater: '2. i 3. godina: {p} 1. godine',
      headLadder: 'Svaka razina: dio vremena u radu',
      breakEvenTag: 'točka pokrića {p}',
      monthLabel: '{m}: {servers}',
      ladderLabel: 'Ugovorena razina: {servers}',
      rowAll: 'Sve po potrošnji',
      rowWith: 'S obvezom',
      parts: '{used} iskorišteno + {unused} neiskorišteno + {od} po potrošnji',
      resultSave: 'ušteda {d} ({p})',
      resultLoss: 'gubitak {d} ({p} više)',
      resultLossNoUse: 'gubitak {d}',
      resultEven: 'jednako kao po potrošnji',
      termsLabel: 'Ista razina, razdoblje obveze:',
      termChip: '{term}, {off} popusta: {res}',
      chipSave: 'ušteda {p}',
      chipLoss: 'gubitak {p}',
      chipEven: 'bez uštede',
      chipNoUse: 'nema potrošnje',
      dragHint: 'Povuci stupac mjeseca ili ga odaberi i koristi strelice; razinu postavi na desnoj ljestvici.',
      priceNote: 'Po potrošnji {p} po poslužitelju mjesečno; uz obvezu na 1 godinu {c1}, na 3 godine {c3}.',
      illustrative: 'Cijene su izmišljene, ali uvjerljive.',
      eur: '{n} €',
      pct: '{n} %',
      pctLt1: 'manje od 1 %',
      pSteady: 'Stalno opterećenje',
      pSteadyHint: 'Osam poslužitelja cijelu godinu: svaki ugovoreni radi stalno, ušteda je cijeli popust.',
      pBaseLoad: 'Osnovno opterećenje',
      pBaseLoadHint: 'Godina s ljetnim porastom i vrhom u prosincu; ugovoreno je šest, vrhovi idu po potrošnji.',
      pCoverPeak: 'Obveza do vrha',
      pCoverPeakHint: 'Ugovoreno trinaest, koliko treba u prosincu: većinu godine plaćaš poslužitelje koji ne rade.',
      pThreeYears: 'Tri godine',
      pThreeYearsHint: 'Ista potrošnja uz obvezu na tri godine: veći popust, točka pokrića pada na 50 %.',
      pUsageFalls: 'Potrošnja padne',
      pUsageFallsHint: 'Od 2. godine ostaje četvrtina potrošnje, a obveza na tri godine i dalje se plaća.',
      legUsed: 'obveza iskorištena',
      legUnused: 'obveza plaćena, neiskorištena',
      legOd: 'po potrošnji',
      legCommit: 'ugovorena razina',
      legBreakEven: 'točka pokrića',
      legPays: 'razina se isplati',
      legChanged: 'promijenio se ishod',
      capNone: 'Ništa nije ugovoreno: sve ide po potrošnji, {all} {term}.',
      capSave: 'Uz obvezu od {servers} {term} plaćaš {paid} (od toga {unused} neiskorišteno) i {od} po potrošnji: ' +
        'ukupno {with} prema {all} kad je sve po potrošnji. Ušteda {d}{pct}.',
      capLoss: 'Uz obvezu od {servers} {term} plaćaš {paid} (od toga {unused} neiskorišteno) i {od} po potrošnji: ' +
        'ukupno {with} prema {all} kad je sve po potrošnji. Gubitak {d}{pct}.',
      capEven: 'Uz obvezu od {servers} {term} plaćaš {paid} (od toga {unused} neiskorišteno) i {od} po potrošnji: ' +
        'ukupno {with}, jednako kao kad je sve po potrošnji.',
      pctParen: ' ({p})',
      nAtBest: 'To je najbolja razina: svaki ugovoreni poslužitelj radi više od {be} vremena.',
      nNonePays: 'Nijedna se razina ne isplati: nijedan poslužitelj ne radi više od {be} vremena.',
      nSameAsBest: 'Najbolja razina, {k}, košta isto: poslužitelji iznad nje rade točno {be} vremena.',
      nBest: 'Najbolja je razina {k}: ugovori poslužitelje koji rade više od {be} vremena.',
      nShrink: 'Od 2. godine potrošnja je {later} one iz 1. godine, a obveza se plaća u cijelosti sve tri godine.',
      nStop: 'Od 2. godine nema potrošnje, a obveza se i dalje plaća u cijelosti sve tri godine.',
      nGrow: 'Od 2. godine potrošnja je {later} one iz 1. godine; sve iznad ugovorene razine ide po potrošnji.',
      explain: '<p><b>Ugovorena potrošnja</b> (engl. <i lang="en">commitment</i>) je obećanje da ćeš određeni broj ' +
        'poslužitelja plaćati cijelo razdoblje, na godinu ili tri. Zauzvrat je cijena niža nego kod <i>plaćanja po ' +
        'potrošnji</i> (engl. <i lang="en">on demand</i>). Ugovoreni poslužitelj plaća se <b>radio ili ne</b>: ' +
        'mjesec u kojem ga ne trebaš i dalje košta.</p>' +
        '<p><b>Točka pokrića</b> je ugovorena cijena podijeljena cijenom po potrošnji. Uz 30 % popusta to je 70 %: ' +
        'ugovoreni poslužitelj isplati se ako radi više od 70 % vremena (više od 8,4 od 12 mjeseci). Uz 50 % popusta ' +
        'dovoljno je više od pola vremena. Ljestvica desno pokazuje za svaku razinu (prvi, drugi, … poslužitelj) koliki ' +
        'dio vremena radi; isplate se one čija traka prelazi točku pokrića.</p>' +
        '<p><b>Ugovori osnovno opterećenje, vrhove ostavi po potrošnji.</b> Najniži poslužitelji rade stalno, oni na ' +
        'vrhu samo nekoliko mjeseci. Najbolja razina nije prosjek ni vrh, nego broj poslužitelja koji rade dulje od ' +
        'točke pokrića. Obveza do vrha plaća cijelu godinu ono što treba mjesec dana i može koštati više nego da ništa ' +
        'nisi ugovorio.</p>' +
        '<p><b>Dulje razdoblje, veći popust i veći rizik.</b> Obveza na tri godine daje veći popust, ali obvezuje i kad ' +
        'se potrošnja promijeni: projekt završi, sustav se preseli, opterećenje padne. Tada neiskorištena obveza raste, ' +
        'a ušteda se pretvori u gubitak. Obveza na godinu dana daje manji popust, ali sljedeće godine biraš ponovo.</p>' +
        '<p>Ovdje se plaća mjesečno, bez uplate unaprijed. Plaćanje unaprijed za dodatni popust je zasebna odluka: ' +
        'popust se uspoređuje s cijenom kapitala.</p>'
    },
    en: {
      stage: 'A year of usage, the commitment level and what it costs: used, unused and on demand',
      commit: 'Commitment level',
      term: 'Term',
      term1: '1 year',
      term3: '3 years',
      later: 'Usage from year 2',
      best: 'Commit at the best level',
      nServers: ['{n} server', '{n} servers'],
      ofServers: ['{n} server', '{n} servers'],
      overYears: ['over {n} year', 'over {n} years'],
      m1: 'Jan', m2: 'Feb', m3: 'Mar', m4: 'Apr', m5: 'May', m6: 'Jun',
      m7: 'Jul', m8: 'Aug', m9: 'Sep', m10: 'Oct', m11: 'Nov', m12: 'Dec',
      headYear1: 'Year 1: servers running, month by month',
      headLater: 'Years 2 and 3: {p} of year 1',
      headLadder: 'Each level: share of the time running',
      breakEvenTag: 'break-even {p}',
      monthLabel: '{m}: {servers}',
      ladderLabel: 'Commitment level: {servers}',
      rowAll: 'All on demand',
      rowWith: 'With the commitment',
      parts: '{used} used + {unused} unused + {od} on demand',
      resultSave: 'saving {d} ({p})',
      resultLoss: 'loss {d} ({p} more)',
      resultLossNoUse: 'loss {d}',
      resultEven: 'the same as on demand',
      termsLabel: 'The same level with a term of:',
      termChip: '{term}, {off} off: {res}',
      chipSave: 'saving {p}',
      chipLoss: 'loss {p}',
      chipEven: 'no saving',
      chipNoUse: 'no usage',
      dragHint: 'Drag a month\'s column, or select it and use the arrow keys; set the level on the ladder at the right.',
      priceNote: 'On demand {p} per server a month; committed for 1 year {c1}, for 3 years {c3}.',
      illustrative: 'The prices are made up but plausible.',
      eur: '€{n}',
      pct: '{n}%',
      pctLt1: 'under 1%',
      pSteady: 'Steady load',
      pSteadyHint: 'Eight servers all year: every committed one runs all the time, and the saving is the whole discount.',
      pBaseLoad: 'The base load',
      pBaseLoadHint: 'A year with a busier summer and a December peak; six committed, the peaks on demand.',
      pCoverPeak: 'Committed to the peak',
      pCoverPeakHint: 'Thirteen committed, what December needs: most of the year you pay for servers that do not run.',
      pThreeYears: 'Three years',
      pThreeYearsHint: 'The same usage with a three-year term: a deeper discount, break-even falls to 50%.',
      pUsageFalls: 'Usage falls',
      pUsageFallsHint: 'From year 2 a quarter of the usage is left, and the three-year commitment is still paid.',
      legUsed: 'commitment used',
      legUnused: 'commitment paid, unused',
      legOd: 'on demand',
      legCommit: 'commitment level',
      legBreakEven: 'break-even',
      legPays: 'the level pays',
      legChanged: 'the outcome changed',
      capNone: 'Nothing committed: everything runs on demand, {all} {term}.',
      capSave: 'With {servers} committed {term} you pay {paid} ({unused} of it unused) and {od} on demand: {with} in ' +
        'all, against {all} all on demand. Saving {d}{pct}.',
      capLoss: 'With {servers} committed {term} you pay {paid} ({unused} of it unused) and {od} on demand: {with} in ' +
        'all, against {all} all on demand. Loss {d}{pct}.',
      capEven: 'With {servers} committed {term} you pay {paid} ({unused} of it unused) and {od} on demand: {with} in ' +
        'all, the same as all on demand.',
      pctParen: ' ({p})',
      nAtBest: 'This is the best level: every committed server runs more than {be} of the time.',
      nNonePays: 'No level pays: no server runs more than {be} of the time.',
      nSameAsBest: 'The best level, {k}, costs the same: the servers above it run exactly {be} of the time.',
      nBest: 'The best level is {k}: commit the servers that run more than {be} of the time.',
      nShrink: 'From year 2 usage is {later} of year 1\'s, and the commitment is paid in full all three years.',
      nStop: 'From year 2 there is no usage, and the commitment is still paid in full all three years.',
      nGrow: 'From year 2 usage is {later} of year 1\'s; everything above the commitment runs on demand.',
      explain: '<p>A <b>commitment</b> is a promise to pay for a number of servers for the whole term, one year or ' +
        'three. In return the price is lower than <i>on demand</i> (pay as you go). A committed server is paid for ' +
        '<b>whether it runs or not</b>: a month you do not need it still costs.</p>' +
        '<p><b>Break-even</b> is the committed price divided by the on-demand price. At 30% off that is 70%: a ' +
        'committed server pays off when it runs more than 70% of the time (more than 8.4 of 12 months). At 50% off, ' +
        'more than half the time is enough. The ladder on the right shows, for every level (the first, second, … ' +
        'server), the share of the time it runs; the levels whose bar crosses break-even are the ones that pay.</p>' +
        '<p><b>Commit the base load, leave the peaks on demand.</b> The lowest servers run all the time, the ones at ' +
        'the top only for a few months. The best level is neither the average nor the peak, but the number of servers ' +
        'that run longer than break-even. Committing to the peak pays all year for what one month needs, and can cost ' +
        'more than committing nothing.</p>' +
        '<p><b>A longer term, a deeper discount and a bigger risk.</b> A three-year term gives a deeper discount, but ' +
        'binds you when usage changes: a project ends, a system moves, the load falls. Then the unused commitment ' +
        'grows and the saving turns into a loss. A one-year term gives a smaller discount, but next year you choose ' +
        'again.</p>' +
        '<p>Here everything is paid monthly, nothing upfront. Paying upfront for a further discount is a separate ' +
        'decision: the discount is compared with the cost of capital.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
