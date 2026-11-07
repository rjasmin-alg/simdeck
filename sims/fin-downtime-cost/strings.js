/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of fin-downtime-cost, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   The title and subtitle come from sim.json. Numbers are formatted in the page (index.html) and passed in. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Koliko košta sat zastoja kroz tjedan i koliko košta i štedi svaka razina dostupnosti',
      target: 'Ciljana dostupnost',
      rev: 'Prihod u radno vrijeme',
      off: 'Prihod izvan radnog vremena',
      people: 'Zaposlenici bez posla',
      fix: 'Rad na oporavku',
      pen: 'Ugovorne kazne',
      ha: 'Redundancija za 99,9\u00a0%',
      best: 'Najjeftinija razina',
      lvl2: '99\u00a0%', lvl3: '99,9\u00a0%', lvl4: '99,99\u00a0%', lvl5: '99,999\u00a0%',
      perHour: '{v}/h',
      perYear: '{v}/god.',
      nPeople: ['{n} osoba', '{n} osobe', '{n} osoba'],
      d1: 'pon', d2: 'uto', d3: 'sri', d4: 'čet', d5: 'pet', d6: 'sub', d7: 'ned',
      headWeek: 'Sat zastoja kroz tjedan: u radno vrijeme {w}, ostali sati {o}',
      avgTag: 'prosjek {a}',
      headLevels: 'Svaka razina dostupnosti, godišnje: očekivani trošak zastoja + redundancija',
      downYear: '{d} zastoja godišnje',
      noRedundancy: 'bez redundancije',
      nineCell: 'devetka štedi {v}, košta {c}',
      levelLabel: '{lvl}: {down}, ukupno {tot}',
      durHM: '{h} h {m} min',
      durH: '{h} h',
      durMS: '{m} min {s} s',
      durM: '{m} min',
      durS: '{s} s',
      resultSave: '{lvl} prema 99\u00a0% bez redundancije: ušteda {d} godišnje',
      resultLoss: '{lvl} prema 99\u00a0% bez redundancije: gubitak {d} godišnje',
      resultEven: '{lvl} prema 99\u00a0% bez redundancije: isti ukupni trošak',
      resultBase: '99\u00a0%: bez redundancije, samo trošak zastoja',
      foot: 'Kvar je jednako vjerojatan u svakom satu tjedna; radno vrijeme je pon–pet 8–18 h; sat rada zaposlenika {w}; ' +
        'svaka sljedeća devetka košta {g} puta više od prethodne.',
      illustrative: 'Iznosi su izmišljeni, ali uvjerljivi.',
      eur: '{n}\u00a0€',
      pct: '{n}\u00a0%',
      pSmallOffice: 'Mali ured',
      pSmallOfficeHint: 'Deset ljudi bez posla u radno vrijeme, izvan njega samo oporavak: prosječni sat košta 419\u00a0€, a ne 700\u00a0€.',
      pOffice: 'Interni sustav',
      pOfficeHint: 'Interni sustav: nema izgubljenog prihoda, ali 200 ljudi ne može raditi.',
      pShop: 'Web-trgovina',
      pShopHint: 'Izvan radnog vremena prodaje više nego u njemu; cilj je 99,99\u00a0%.',
      pPayments: 'Platni sustav',
      pPaymentsHint: 'Velik prihod u svakom satu i ugovorne kazne: isplati se i četvrta devetka.',
      pFiveNines: 'Pet devetki',
      pFiveNinesHint: 'Isti platni sustav uz cilj 99,999\u00a0%: peta devetka štedi oko 21\u00a0000\u00a0€, a košta 360\u00a0000\u00a0€.',
      legRev: 'izgubljeni prihod',
      legStaff: 'zaposlenici bez posla',
      legFix: 'rad na oporavku',
      legPen: 'ugovorne kazne',
      legHa: 'redundancija',
      legAvg: 'prosječni sat',
      legBest: 'najjeftinija razina',
      legChanged: 'promijenio se ishod ili najjeftinija razina',
      capBase: 'Bez redundancije (99\u00a0%) sustav je u zastoju oko {down} godišnje, uz očekivani trošak {dc} godišnje.',
      capSave: 'Uz {lvl} sustav je u zastoju oko {down} godišnje: očekivani trošak zastoja {dc} i redundancija {ha}, ' +
        'ukupno {tot} prema {base} bez redundancije. Ušteda {d} godišnje.',
      capLoss: 'Uz {lvl} sustav je u zastoju oko {down} godišnje: očekivani trošak zastoja {dc} i redundancija {ha}, ' +
        'ukupno {tot} prema {base} bez redundancije. Gubitak {d} godišnje.',
      capEven: 'Uz {lvl} sustav je u zastoju oko {down} godišnje: očekivani trošak zastoja {dc} i redundancija {ha}, ' +
        'ukupno {tot}, jednako kao bez redundancije.',
      nAtBest: 'To je najjeftinija razina: svaka devetka do nje štedi više nego što košta.',
      nNonePays: 'Nijedna se devetka ne isplati: prva bi uštedjela {v}, a košta {c} godišnje.',
      nSameAsBest: 'Najjeftinija razina, {lvl}, košta isto, uz manje devetki.',
      nBest: 'Najjeftinija je razina {lvl}: ukupno {tot} godišnje.',
      nNaive: 'Kad bi svaki sat zastoja koštao kao radni ({w}), najjeftinija bi bila {lvl}; no kvar dolazi u bilo ' +
        'koji sat, a prosječni sat košta {a}.',
      explain: '<p><b>Trošak zastoja</b> (engl. <i lang="en">cost of downtime</i>) zbraja četiri dijela: ' +
        '<b>izgubljeni prihod</b>, <b>zaposlenike bez posla</b> (plaćeni su, a ne mogu raditi), <b>rad na oporavku</b> ' +
        '(inženjeri, prekovremeni rad, vanjska pomoć) i <b>ugovorne kazne</b> prema korisnicima. Sat zastoja ne košta ' +
        'uvijek isto: u radno vrijeme stoje i ljudi, a web-trgovina najviše prodaje navečer i vikendom. Kvar ne bira ' +
        'sat, pa je očekivani trošak sata <b>prosjek tjedna</b>, a ne cijena najskupljeg sata. Prihod izvan radnog ' +
        'vremena zadaje se kao postotak prihoda u radno vrijeme.</p>' +
        '<p><b>Dostupnost</b> se mjeri u <b>devetkama</b>: 99&nbsp;% dopušta oko 87,6 sati zastoja godišnje, 99,9&nbsp;% oko ' +
        '8,8 sati, 99,99&nbsp;% oko 53 minute, 99,999&nbsp;% oko 5 minuta. Svaka nova devetka uklanja desetinu zastoja koji je ' +
        'uklonila prethodna. Isto vrijedi za proračun pogrešaka (engl. <i lang="en">error budget</i>): minute koje ' +
        'cilj dopušta ovdje postaju eure.</p>' +
        '<p><b>Visoka dostupnost</b> (engl. <i lang="en">high availability</i>, HA) kupuje se <b>redundancijom</b>: ' +
        'drugi poslužitelj, druga lokacija, automatsko preuzimanje, dežurstva. Svaka devetka traži više od prethodne, ' +
        'pa i košta više. Devetka se isplati kad štedi više očekivanog troška zastoja nego što godišnje košta. ' +
        'Najjeftinija razina je ona gdje se devetke prestaju isplaćivati.</p>' +
        '<p>Sati zastoja jednog incidenta (otkrivanje, odluka, vraćanje, provjera) i gubitak podataka su tema ' +
        'stranice o RPO i RTO; ovdje se gleda samo godišnji zbroj sati i njihova cijena.</p>'
    },
    en: {
      stage: 'What an hour down costs across the week, and what each level of availability costs and saves',
      target: 'Availability target',
      rev: 'Revenue, working hours',
      off: 'Revenue, other hours',
      people: 'People who cannot work',
      fix: 'Recovery work',
      pen: 'Contract penalties',
      ha: 'Redundancy for 99.9%',
      best: 'Cheapest level',
      lvl2: '99%', lvl3: '99.9%', lvl4: '99.99%', lvl5: '99.999%',
      perHour: '{v}/h',
      perYear: '{v}/yr',
      nPeople: ['{n} person', '{n} people'],
      d1: 'Mon', d2: 'Tue', d3: 'Wed', d4: 'Thu', d5: 'Fri', d6: 'Sat', d7: 'Sun',
      headWeek: 'An hour down across the week: working hours {w}, other hours {o}',
      avgTag: 'average {a}',
      headLevels: 'Each level of availability, a year: expected downtime cost + redundancy',
      downYear: '{d} down a year',
      noRedundancy: 'no redundancy',
      nineCell: 'the nine saves {v}, costs {c}',
      levelLabel: '{lvl}: {down}, {tot} in all',
      durHM: '{h} h {m} min',
      durH: '{h} h',
      durMS: '{m} min {s} s',
      durM: '{m} min',
      durS: '{s} s',
      resultSave: '{lvl} against 99% with no redundancy: saving {d} a year',
      resultLoss: '{lvl} against 99% with no redundancy: loss {d} a year',
      resultEven: '{lvl} against 99% with no redundancy: the same total',
      resultBase: '99%: no redundancy, only the cost of downtime',
      foot: 'A failure is equally likely in any hour of the week; working hours are Mon–Fri 8:00–18:00; a person-hour ' +
        'costs {w}; each further nine costs {g} times the one before.',
      illustrative: 'The amounts are made up but plausible.',
      eur: '€{n}',
      pct: '{n}%',
      pSmallOffice: 'Small office',
      pSmallOfficeHint: 'Ten people idle in working hours, outside them only recovery: the average hour costs €419, not €700.',
      pOffice: 'Internal app',
      pOfficeHint: 'An internal application: no revenue lost, but 200 people cannot work.',
      pShop: 'Online shop',
      pShopHint: 'It sells more outside working hours than in them; the target is 99.99%.',
      pPayments: 'Payments',
      pPaymentsHint: 'High revenue every hour and contract penalties: even the fourth nine pays.',
      pFiveNines: 'Five nines',
      pFiveNinesHint: 'The same payment system aiming at 99.999%: the fifth nine saves about €21,000 and costs €360,000.',
      legRev: 'lost revenue',
      legStaff: 'idle staff',
      legFix: 'recovery work',
      legPen: 'contract penalties',
      legHa: 'redundancy',
      legAvg: 'average hour',
      legBest: 'cheapest level',
      legChanged: 'the outcome or cheapest level changed',
      capBase: 'With no redundancy (99%) the system is down about {down} a year, at an expected cost of {dc} a year.',
      capSave: 'At {lvl} the system is down about {down} a year: expected downtime cost {dc} and redundancy {ha}, ' +
        '{tot} in all, against {base} with no redundancy. Saving {d} a year.',
      capLoss: 'At {lvl} the system is down about {down} a year: expected downtime cost {dc} and redundancy {ha}, ' +
        '{tot} in all, against {base} with no redundancy. Loss {d} a year.',
      capEven: 'At {lvl} the system is down about {down} a year: expected downtime cost {dc} and redundancy {ha}, ' +
        '{tot} in all, the same as with no redundancy.',
      nAtBest: 'This is the cheapest level: every nine up to it saves more than it costs.',
      nNonePays: 'No nine pays: the first would save {v} and costs {c} a year.',
      nSameAsBest: 'The cheapest level, {lvl}, costs the same with fewer nines.',
      nBest: 'The cheapest level is {lvl}: {tot} a year in all.',
      nNaive: 'If every hour down cost a working hour ({w}), the cheapest level would be {lvl}; but a failure comes at ' +
        'any hour, and the average hour costs {a}.',
      explain: '<p>The <b>cost of downtime</b> adds four parts: <b>lost revenue</b>, <b>idle staff</b> (paid, but ' +
        'unable to work), <b>recovery work</b> (engineers, overtime, outside help) and <b>contract penalties</b> owed ' +
        'to customers. An hour down does not always cost the same: in working hours the people stand idle too, and an ' +
        'online shop sells most in the evenings and at weekends. A failure does not choose its hour, so the expected ' +
        'cost of an hour is the <b>week\'s average</b>, not the price of the dearest hour. Revenue in other hours is ' +
        'set as a share of the working-hour revenue.</p>' +
        '<p><b>Availability</b> is counted in <b>nines</b>: 99% allows about 87.6 hours down a year, 99.9% about ' +
        '8.8 hours, 99.99% about 53 minutes, 99.999% about 5 minutes. Each new nine removes a tenth of the downtime ' +
        'the one before removed. The same holds for an <i>error budget</i>: the minutes a target allows become euros ' +
        'here.</p>' +
        '<p><b>High availability</b> (HA) is bought with <b>redundancy</b>: a second server, a second site, automatic ' +
        'failover, on-call staff. Each nine needs more than the one before, and costs more. A nine pays when it saves ' +
        'more expected downtime cost than it costs a year. The cheapest level is where the nines stop paying.</p>' +
        '<p>The hours of a single incident (detection, decision, restore, verification) and the data lost are the ' +
        'subject of the RPO and RTO page; here only the yearly total of hours and their price count.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
