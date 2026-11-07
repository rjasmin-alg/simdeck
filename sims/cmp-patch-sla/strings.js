/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the page, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural forms
   (hr: 1 / 2–4 / 5+, en: 1 / other). The title and subtitle are not here: they come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Godina ranjivosti: izvještaj, izloženost i otvorene ranjivosti po starosti',

      sev_0: 'kritična', sev_1: 'visoka', sev_2: 'srednja', sev_3: 'niska',
      days: ['{d} dan', '{d} dana', '{d} dana'],
      dShort: '{d} d',
      daysAvg: '{d} dana',

      // the tiles
      kInTime: 'Otklonjeno u roku (izvještaj)',
      kInTimeSub: '{n} od {c} koje se broje',
      kInTimeExc: ['{e} pod iznimkom ne broji se', '{e} pod iznimkom ne broje se', '{e} pod iznimkom ne broji se'],
      kMean: 'Prosječno do otklanjanja',
      kMeanSub: 'otklonjenih: {f}',
      kOldest: 'Najstarija otvorena',
      kOldestOwned: '{sev}, sustav s vlasnikom',
      kOldestUnowned: '{sev}, sustav bez vlasnika',
      kNoneOpen: 'nijedna',
      kOpen: 'Otvoreno na kraju godine',
      kOpenSub: 'preko roka: {o}',

      // where the exposure is
      headWhere: 'Gdje je izloženost (otvorene ranjivosti × dani)',
      rowItems: 'Ranjivosti',
      rowExposure: 'Izloženost',
      segUnowned: 'bez vlasnika',
      expUnit: '{n} ranjivost-dana',

      // the order
      headKev: 'Izloženost iskorištavanih ranjivosti, isti tok',
      byScore: 'Po ocjeni',
      byKev: 'Iskorištavane prve',
      kevInTime: 'u roku {pct}',

      // the age chart
      headAge: 'Otvorene ranjivosti na kraju godine, po starosti (stupci po 10 dana)',
      laneOwned: 'Sustavi s vlasnikom',
      laneUnowned: 'Sustavi bez vlasnika',
      laneSub: 'otvoreno {n}',
      laneSubExc: 'otvoreno {n}, pod iznimkom {e}',
      laneEmpty: 'Nijedan sustav nije bez vlasnika.',
      axisAge: 'starost u danima',
      dlLabel: '{sev}, {d} d',
      binLabel: 'starost {a}–{b} dana: otvoreno {n}',
      newStream: 'Novi tok',

      // params, presets, legend
      order: 'Red čekanja',
      orderScore: 'po ocjeni',
      orderKev: 'iskorištavane prve',
      cap: 'Otklanjanja dnevno (tim)',
      unowned: 'Sustavi bez vlasnika (od 20)',
      exc: 'Iznimka nakon roka (sustavi bez vlasnika)',
      excNone: 'nema',
      excOpen: 'bez roka',
      excDated: 'vlasnik i rok',
      dlHead: 'Rokovi:',
      dlDown: '{what}: kraće',
      dlUp: '{what}: dulje',
      dCrit: 'Rok za kritične',
      dHigh: 'Rok za visoke',
      dMed: 'Rok za srednje',
      dLow: 'Rok za niske',
      noUnowned: 'Nema sustava bez vlasnika.',
      pReport: 'Izvještaj izgleda dobro',
      pReportHint: 'Prekoračene ranjivosti na sustavima bez vlasnika idu pod iznimku bez roka i ne broje se.',
      pNoExc: 'Bez iznimaka',
      pNoExcHint: 'Iste ranjivosti, ali prekoračene se broje: postotak pada, izloženost ostaje.',
      pDated: 'Iznimka s vlasnikom i rokom',
      pDatedHint: 'Iznimka traje 30 dana, a vlasnik stavlja ranjivost u red čekanja istog tima.',
      pShort: 'Premalo ruku, po ocjeni',
      pShortHint: 'Tri otklanjanja dnevno, a stižu četiri: iskorištavane srednje čekaju iza viših ocjena.',
      pKev: 'Iskorištavane prve',
      pKevHint: 'Isti tim i isti tok: postotak gotovo isti, izloženost iskorištavanih mnogo manja.',
      pTight: 'Kraći rokovi na papiru',
      pTightHint: 'Rokovi upola kraći: postotak pada, a ništa nije otklonjeno brže.',
      legCrit: 'kritična',
      legHigh: 'visoka',
      legMed: 'srednja',
      legLow: 'niska',
      legKev: 'iskorištavana',
      legExc: 'pod iznimkom',

      // the caption
      nVulns: ['otvorena je {c} ranjivost', 'otvorene su {c} ranjivosti', 'otvoreno je {c} ranjivosti'],
      capTail: 'Izvještaj: u roku {pct}, prosječno za {mean}. Na kraju godine {open}, najstarija {oldest}. Sustavi bez vlasnika imaju {iu} ranjivosti, a {eu} izloženosti.',
      capTailOwned: 'Izvještaj: u roku {pct}, prosječno za {mean}. Na kraju godine {open}, najstarija {oldest}: prosjek ne pokazuje rep.',
      capClean: 'Izvještaj: u roku {pct}, prosječno za {mean}. Tim stiže sve: na kraju godine ništa nije otvoreno dulje od mjesec dana.',
      nOpenExc: 'Iznimke bez roka ({e}) ne ulaze u postotak: izvještaj izgleda bolje, a izloženost je ista.',
      nDated: 'Svaka iznimka ima vlasnika i rok od 30 dana: vlasnik stavlja ranjivost u red, otklonjena do roka broji se kao u roku, a neotklonjena opet je prekoračena. Isti tim sada nosi i njih: izloženost prelazi na sustave s vlasnikom, a ukupno jedva pada.',
      nDeadlines: 'S rokovima 15/30/90/180 dana u roku bi bilo {p0}; izloženost je ista, jer rok ne otklanja ništa.',
      nUnowned: 'Prekoračene ranjivosti na sustavima bez vlasnika ({u}) broje se: postotak je pošteniji, a izloženost ista.',
      nByScore: 'Po ocjeni, iskorištavane ranjivosti niže ocjene čekaju iza svih viših: njihova izloženost je {a}, a s iskorištavanima prvima bila bi {b}.',
      nByKev: 'Iskorištavane prve: njihova izloženost je {b} umjesto {a}, a postotak u roku gotovo se ne mijenja ({p1} → {p2}).',

      foot: 'Pojednostavljeno, nije pravni savjet. Tvrtka, sustavi i brojevi su izmišljeni.',

      explain:
        '<p><b>Politika otklanjanja ranjivosti</b> (<i>remediation policy</i>) daje rok prema ozbiljnosti, ' +
        'npr. 15 dana za kritične i 180 za niske. Izvještaj o usklađenosti obično broji <b>udio otklonjen u roku</b>, ' +
        'ali stvarni rizik je <b>izloženost</b> (<i>exposure</i>): otvorene ranjivosti × dani.</p>' +
        '<ul>' +
        '<li>Prosjek skriva <b>rep</b>: tim otklanja većinu za nekoliko dana, a ranjivosti na ' +
        '<b>sustavima bez vlasnika</b> ne planira nitko. Malo ih je, a nose većinu izloženosti.</li>' +
        '<li>Red po ocjeni (0–10) stavlja ranjivosti koje se već <b>iskorištavaju u napadima</b> (<i>known ' +
        'exploited</i>) iza svih s višom ocjenom. Iskorištavane prve: ukupno otvorenih je isto, ali otvorene su ' +
        'one manje opasne.</li>' +
        '<li>Kraći rok mijenja postotak, ne izloženost: više ruku otklanja brže, a bolji redoslijed prvo one opasne.</li>' +
        '<li><b>Iznimka</b> (<i>exception</i>) je prihvaćeni rizik. Bez vlasnika i roka isteka ranjivost samo ' +
        'nestane iz izvještaja; s njima netko odgovara za nju, a rok je vraća u izvještaj.</li>' +
        '</ul>' +
        '<p>Srodno: kako zakrpa stiže do računala; upravljanje promjenama; registar rizika.</p>' +
        '<p>Odakle: ISO/IEC 27001:2022, kontrola 8.8 (upravljanje tehničkim ranjivostima); NIS2, Direktiva (EU) ' +
        '2022/2555, čl. 21. st. 2. t. (e): postupanje s ranjivostima; ocjena ozbiljnosti 0–10 prema ljestvici CVSS.</p>'
    },

    en: {
      stage: 'A year of vulnerabilities: the report, the exposure and the open items by age',

      sev_0: 'critical', sev_1: 'high', sev_2: 'medium', sev_3: 'low',
      days: ['{d} day', '{d} days'],
      dShort: '{d} d',
      daysAvg: '{d} days',

      kInTime: 'Fixed in time (the report)',
      kInTimeSub: '{n} of {c} counted',
      kInTimeExc: ['{e} on exception, not counted', '{e} on exception, not counted'],
      kMean: 'Average time to fix',
      kMeanSub: 'fixed: {f}',
      kOldest: 'Oldest open',
      kOldestOwned: '{sev}, a system with an owner',
      kOldestUnowned: '{sev}, a system nobody owns',
      kNoneOpen: 'none',
      kOpen: 'Open at year end',
      kOpenSub: 'past the deadline: {o}',

      headWhere: 'Where the exposure is (open vulnerabilities × days)',
      rowItems: 'Vulnerabilities',
      rowExposure: 'Exposure',
      segUnowned: 'on systems nobody owns',
      expUnit: '{n} vulnerability-days',

      headKev: 'Exposure of the exploited ones, same stream',
      byScore: 'By score',
      byKev: 'Exploited first',
      kevInTime: 'in time {pct}',

      headAge: 'Open at year end, by age (columns of 10 days)',
      laneOwned: 'Systems with an owner',
      laneUnowned: 'Systems nobody owns',
      laneSub: 'open {n}',
      laneSubExc: 'open {n}, on exception {e}',
      laneEmpty: 'No system is without an owner.',
      axisAge: 'age in days',
      dlLabel: '{sev}, {d} d',
      binLabel: 'age {a}–{b} days: open {n}',
      newStream: 'New stream',

      order: 'Queue order',
      orderScore: 'by score',
      orderKev: 'exploited first',
      cap: 'Fixes a day (team)',
      unowned: 'Systems nobody owns (of 20)',
      exc: 'Exception when overdue (systems nobody owns)',
      excNone: 'none',
      excOpen: 'open-ended',
      excDated: 'owner + date',
      dlHead: 'Deadlines:',
      dlDown: '{what}: shorter',
      dlUp: '{what}: longer',
      dCrit: 'Deadline, critical',
      dHigh: 'Deadline, high',
      dMed: 'Deadline, medium',
      dLow: 'Deadline, low',
      noUnowned: 'No system is without an owner.',
      pReport: 'The report looks good',
      pReportHint: 'Overdue items on systems nobody owns get an open-ended exception and are not counted.',
      pNoExc: 'No exceptions',
      pNoExcHint: 'The same items, but overdue ones count: the percentage drops, the exposure stays.',
      pDated: 'Exception with owner and end date',
      pDatedHint: 'The exception runs 30 days, and its owner puts the item in the same team\'s queue.',
      pShort: 'Too few hands, by score',
      pShortHint: 'Three fixes a day, four arriving: exploited mediums wait behind higher scores.',
      pKev: 'Exploited first',
      pKevHint: 'The same team and stream: almost the same percentage, far less exploited exposure.',
      pTight: 'Shorter deadlines on paper',
      pTightHint: 'Deadlines halved: the percentage drops, and nothing is fixed sooner.',
      legCrit: 'critical',
      legHigh: 'high',
      legMed: 'medium',
      legLow: 'low',
      legKev: 'exploited',
      legExc: 'on exception',

      nVulns: ['{c} vulnerability is open', '{c} vulnerabilities are open'],
      capTail: 'The report: in time {pct}, on average in {mean}. At year end {open}, the oldest {oldest}. Systems nobody owns have {iu} of the vulnerabilities and {eu} of the exposure.',
      capTailOwned: 'The report: in time {pct}, on average in {mean}. At year end {open}, the oldest {oldest}: the average does not show the tail.',
      capClean: 'The report: in time {pct}, on average in {mean}. The team keeps up: at year end nothing has been open for more than a month.',
      nOpenExc: 'Open-ended exceptions ({e}) stay out of the percentage: the report looks better, the exposure is the same.',
      nDated: 'Each exception has an owner and a 30-day end date: the owner puts the item in the queue, a fix by the end date counts as in time, and if it is not fixed by then it is overdue again. The same team now carries them: the exposure moves to systems with an owner and in total barely falls.',
      nDeadlines: 'With deadlines of 15/30/90/180 days it would be {p0} in time; the exposure is the same, because a deadline fixes nothing.',
      nUnowned: 'Overdue items on systems nobody owns ({u}) are counted: the percentage is more honest, the exposure the same.',
      nByScore: 'By score, exploited items with lower scores wait behind every higher one: their exposure is {a}; exploited first it would be {b}.',
      nByKev: 'Exploited first: their exposure is {b} instead of {a}, and the share in time barely moves ({p1} → {p2}).',

      foot: 'Simplified, not legal advice. The firm, the systems and the numbers are made up.',

      explain:
        '<p>A <b>remediation policy</b> sets a deadline by severity, for example 15 days for critical and 180 for ' +
        'low. The compliance report usually counts the <b>share fixed in time</b>, but the real risk is the ' +
        '<b>exposure</b>: open vulnerabilities × days.</p>' +
        '<ul>' +
        '<li>The average hides the <b>tail</b>: the team fixes most items in a few days, but nobody plans the ' +
        'work on <b>systems nobody owns</b>. They are few, and they carry most of the exposure.</li>' +
        '<li>Ordering by score (0–10) puts the vulnerabilities already <b>known to be exploited</b> behind every ' +
        'higher score. Exploited first: as many stay open, but the ones left open are the less dangerous.</li>' +
        '<li>A shorter deadline changes the percentage, not the exposure: more hands fix things sooner; a better ' +
        'order fixes the dangerous ones first.</li>' +
        '<li>An <b>exception</b> is an accepted risk. Without an owner and an end date the item just leaves the ' +
        'report; with them someone answers for it and the date brings it back.</li>' +
        '</ul>' +
        '<p>Related: how an update reaches a client; change management; the risk register.</p>' +
        '<p>Sources: ISO/IEC 27001:2022, control 8.8 (management of technical vulnerabilities); NIS2, Directive ' +
        '(EU) 2022/2555, art. 21(2)(e): vulnerability handling; severity scored 0–10 on the CVSS scale.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
