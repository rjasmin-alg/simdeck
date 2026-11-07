/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of fin-chargeback, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   The title and subtitle come from sim.json. Numbers are formatted in the page (index.html) and passed in.
   Croatian sentences put a department's name only where nothing agrees with its gender (a present-tense verb,
   "najprije", "tog odjela"), since the names are of different genders. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Zajednički trošak IT-a raspodijeljen na pet odjela po ključu, i ukupni trošak tvrtke krug po krug',
      key: 'Ključ raspodjele',
      mode: 'Računi se',
      fixed: 'Fiksni dio zajedničkog troška',
      use: 'Potrošnja: {d}',
      out: 'Izvan: {d}',
      kUsers: 'korisnici',
      kVms: 'VM-ovi',
      kTb: 'pohrana',
      kTickets: 'zahtjevi',
      mShow: 'prikazuju',
      mCharge: 'naplaćuju',
      dSales: 'Prodaja',
      dAcct: 'Računovodstvo',
      dDev: 'Razvoj',
      dSup: 'Podrška korisnicima',
      dMkt: 'Marketing',
      nUsers: ['{n} korisnik', '{n} korisnika', '{n} korisnika'],
      nVms: ['{n} VM', '{n} VM-a', '{n} VM-ova'],
      nTb: '{n} TB',
      nTickets: ['{n} zahtjev', '{n} zahtjeva', '{n} zahtjeva'],
      perUsers: '{v} po korisniku',
      perVms: '{v} po VM-u',
      perTb: '{v} po TB',
      perTickets: '{v} po zahtjevu',
      byUsers: 'po broju korisnika',
      byVms: 'po broju VM-ova',
      byTb: 'po pohrani (TB)',
      byTickets: 'po broju zahtjeva',
      eur: '{n} €',
      pct: '{n} %',
      perMonth: '{v} mjesečno',
      less: 'manje',
      more: 'više',
      leave: 'Izlazi',
      back: 'Vraća se',
      headDepts: 'Račun svakog odjela mjesečno',
      headRounds: 'Tvrtka ukupno, krug po krug',
      billShown: 'račun {b} (samo prikazan)',
      billCharged: 'račun {b}',
      billLeft: 'račun {b}',
      offer: 'ponuda {q}',
      own: 'vlastiti {v}',
      stIn: 'ostaje',
      stOver: '⚠ uz naplatu izlazi',
      stLeft: '✕ izlazi u {r}. krugu',
      stForced: '✕ izvan, kupuje vani',
      sharedLine: 'zajednički trošak {t} = fiksno {f} + varijabilno {v}',
      baseLine: 'kad su svi unutra: {c} mjesečno',
      round: '{r}. krug',
      roundLeaves: '→ izlazi {d}',
      roundStays: 'nitko ne izlazi',
      roundShow: 'samo prikaz: nitko ne plaća',
      roundEmpty: 'nitko nije ostao',
      resShow: 'Prikaz: nitko ne plaća, nitko ne izlazi',
      resShowOver: 'Prikaz: uz naplatu najprije izlazi {d}',
      resShowOut: 'Prikaz: nitko ne plaća, nitko drugi ne izlazi',
      resStable: 'Svi ostaju',
      resStableOut: 'Ostali ostaju; tvrtka plaća {c} više',
      resSpiral: ['{n} odjel izlazi; tvrtka plaća {c} više nego kad su svi unutra',
        '{n} odjela izlaze; tvrtka plaća {c} više nego kad su svi unutra',
        '{n} odjela izlazi; tvrtka plaća {c} više nego kad su svi unutra'],
      resCollapse: 'Svi su izašli; fiksni trošak ostaje bez ikoga',
      resEmpty: 'Nitko nije unutra; fiksni trošak ostaje',
      resEmptyFree: 'Nitko nije unutra; unutra se nema što platiti',
      foot: 'Varijabilni trošak mjesečno: {u} po korisniku, {m} po VM-u, {t} po TB, {k} po zahtjevu.',
      illustrative: 'Iznosi su izmišljeni, ali uvjerljivi.',
      pByUsers: 'Po korisnicima',
      pByUsersHint: 'Podrška korisnicima ima najviše ljudi pa nosi najveći dio: 15 919 € od 39 480 €.',
      pByVms: 'Po VM-ovima',
      pByVmsHint: 'Isti trošak, drugi ključ: Razvoj sada nosi 60 %, a Podrška samo 3 158 €.',
      pDevGrows: 'Razvoj raste',
      pDevGrowsHint: 'Razvoj udvostručuje potrošnju, a računi svih ostalih padaju: fiksni dio dijeli se na više VM-ova.',
      pCharged: 'Naplata po pohrani',
      pChargedHint: 'Interna naplata po TB: svaki je račun ispod vanjske ponude, pa svi ostaju.',
      pOneLeaves: 'Marketing izlazi',
      pOneLeavesHint: 'Marketing odlazi vanjskom dobavljaču; Računovodstvo prelazi svoju ponudu i izlazi za njim, ' +
        'a onda lanac staje.',
      pSpiral: 'Spirala',
      pSpiralHint: 'Naplata po korisnicima: Podrška izlazi, cijena po korisniku raste i izlaze još tri odjela.',
      legCharged: 'račun (naplaćen)',
      legShown: 'račun (prikazan)',
      legOwn: 'vlastiti varijabilni trošak',
      legOffer: 'vanjska ponuda',
      legOut: 'izvan, plaća vani',
      legChanged: 'promijenjeno',
      legBase: 'svi unutra',
      capShow: '{s} {k}: zajednički trošak od {t} mjesečno daje {u}. ' +
        'Računi su samo prikazani: nitko ih ne plaća, pa nitko ne izlazi.',
      capStable: '{s} {k}: {u}. Svaki odjel plaća najviše koliko i vanjska ponuda, ' +
        'pa svi ostaju.',
      capSpiral1: '{s} {k}: izlazi {d}, račun {b} veći je od vanjske ponude od {q}. ' +
        'Fiksni dio tog računa ostaje ostalima: cijena raste s {u0} na {u1}, ali nitko drugi ne prelazi svoju ponudu.',
      capSpiralN: '{s} {k}: najprije izlazi {d}, račun {b} veći je od vanjske ponude od {q}. ' +
        'Fiksnih {f} ostaje, pa cijena raste s {u0} na {u1}, a zatim izlaze i drugi: ukupno {m}.',
      capCollapse: '{s} {k}: najprije izlazi {d} ({b} prema ponudi od {q}), a cijena koja ' +
        'raste istjera sve ostale. Tvrtka i dalje plaća fiksnih {f} za platformu koju nitko ne koristi.',
      capEmpty: 'Svi su odjeli izvan: tvrtka i dalje plaća fiksnih {f} mjesečno za platformu koju nitko ne koristi, ' +
        'i još {o} vani.',
      capEmptyFree: 'Svi su odjeli izvan, a bez fiksnog troška zajednička platforma ne košta ništa; tvrtka plaća {o} ' +
        'vani.',
      termShow: '<i>Showback</i> (prikaz troškova)',
      termCharge: '<i>Chargeback</i> (interna naplata)',
      nMore: ['{n} odjel', '{n} odjela', '{n} odjela'],
      nWould: 'Uz naplatu najprije izlazi {d}: račun {b} veći je od vanjske ponude od {q}.',
      nForced: '{d} je izvan: tvrtka štedi samo vlastiti varijabilni trošak tog odjela, {v}; ostatak njegova računa, ' +
        '{r}, prelazi na ostale.',
      nForcedN: 'Odjeli koji su izvan štede tvrtki samo vlastiti varijabilni trošak, {v}; ostatak njihovih računa, ' +
        'ukupno {r}, prelazi na ostale.',
      nForcedSub: '{d} je izvan: račun tog odjela ({b}) bio je manji od vlastitog varijabilnog troška ({v}), ' +
        'pa ostali sada plaćaju manje.',
      nForcedSubN: 'Računi odjela koji su izvan ukupno su ({b}) bili manji od njihova vlastitog varijabilnog troška ' +
        '({v}), pa ostali sada ukupno plaćaju {r} manje.',
      nForcedEven: '{d} je izvan: račun tog odjela bio je jednak vlastitom varijabilnom trošku ({v}), pa ostali ' +
        'plaćaju isto.',
      nForcedEvenN: 'Računi odjela koji su izvan ukupno su jednaki njihovu vlastitom varijabilnom trošku ({v}), ' +
        'pa ostali ukupno plaćaju isto.',
      nTotal: 'Tvrtka ukupno plaća {c} mjesečno umjesto {c0} kad su svi unutra.',
      explain: '<p>Zajednički trošak IT-a (tim, podatkovni centar, osnovne licence) treba nekako podijeliti na odjele. ' +
        '<b>Ključ raspodjele</b> odlučuje kako: po broju korisnika, VM-ova, terabajta ili zahtjeva. Svaki odjel ' +
        'plaća udio ukupnog troška jednak svom udjelu u jedinicama ključa. Ukupni trošak isti je za svaki ključ; ' +
        'ključ odlučuje samo tko ga plaća.</p>' +
        '<p>Samo <b>varijabilni troškovi</b> stvarno prate potrošnju. <b>Fiksni troškovi</b> nemaju prirodan ključ: ' +
        'koji god se izabere, netko dobiva veći dio nego što uzrokuje. Dok je većina troška fiksna, rast jednog odjela ' +
        'spušta cijenu po jedinici svima ostalima, a izlazak jednog je diže. (Bez fiksnog troška može biti obrnuto: ' +
        'odjel s velikim vlastitim troškom po jedinici diže cijenu kad raste.)</p>' +
        '<p><i>Showback</i> (prikaz troškova) odjelima samo pokazuje račun, a trošak ostaje u proračunu IT-a. ' +
        '<i>Chargeback</i> (interna naplata) račun stvarno prebacuje u proračun odjela. Tada odjel uspoređuje račun ' +
        's vanjskom ponudom i, ako je skuplji, kupuje vani.</p>' +
        '<p>Odjel koji izađe štedi tvrtki samo svoj varijabilni trošak. Fiksni dio njegova računa ostaje i dijeli ' +
        'se na ostale, pa njihova <b>jedinična cijena</b> raste i sljedeći odjel prelazi svoju ponudu: ' +
        '<b>spirala</b>. Tvrtka na kraju plaća više nego da su svi ostali. Spirala staje kad nitko ne prelazi ' +
        'ponudu, a s manjim fiksnim dijelom ne počinje.</p>' +
        '<p>U svakom krugu izlazi jedan odjel, onaj čiji račun najviše prelazi ponudu. Iznosi su mjesečni; ' +
        'fiksni trošak ne može se smanjiti u kratkom roku, a vanjske ponude ne ovise o tome tko je ostao.</p>'
    },
    en: {
      stage: 'A shared IT cost allocated to five departments by a key, and the company\'s total round by round',
      key: 'Allocation key',
      mode: 'Bills are',
      fixed: 'Fixed part of the shared cost',
      use: 'Usage: {d}',
      out: 'Out: {d}',
      kUsers: 'users',
      kVms: 'VMs',
      kTb: 'storage',
      kTickets: 'tickets',
      mShow: 'shown',
      mCharge: 'charged',
      dSales: 'Sales',
      dAcct: 'Accounting',
      dDev: 'Development',
      dSup: 'Customer support',
      dMkt: 'Marketing',
      nUsers: ['{n} user', '{n} users'],
      nVms: ['{n} VM', '{n} VMs'],
      nTb: '{n} TB',
      nTickets: ['{n} ticket', '{n} tickets'],
      perUsers: '{v} per user',
      perVms: '{v} per VM',
      perTb: '{v} per TB',
      perTickets: '{v} per ticket',
      byUsers: 'by users',
      byVms: 'by VMs',
      byTb: 'by storage (TB)',
      byTickets: 'by tickets',
      eur: '€{n}',
      pct: '{n}%',
      perMonth: '{v} a month',
      less: 'less',
      more: 'more',
      leave: 'Leave',
      back: 'Come back',
      headDepts: 'Each department\'s bill a month',
      headRounds: 'The company\'s total, round by round',
      billShown: 'bill {b} (shown only)',
      billCharged: 'bill {b}',
      billLeft: 'bill {b}',
      offer: 'offer {q}',
      own: 'own {v}',
      stIn: 'stays',
      stOver: '⚠ would leave if charged',
      stLeft: '✕ leaves in round {r}',
      stForced: '✕ out, buying outside',
      sharedLine: 'shared cost {t} = fixed {f} + variable {v}',
      baseLine: 'with everyone in: {c} a month',
      round: 'Round {r}',
      roundLeaves: '→ {d} leaves',
      roundStays: 'nobody leaves',
      roundShow: 'shown only: nobody pays',
      roundEmpty: 'nobody is left',
      resShow: 'Showback: nobody pays, nobody leaves',
      resShowOver: 'Showback: if charged, {d} leaves first',
      resShowOut: 'Showback: nobody pays, nobody else leaves',
      resStable: 'Everyone stays',
      resStableOut: 'The rest stay; the company pays {c} more',
      resSpiral: ['{n} department leaves; the company pays {c} more than with everyone in',
        '{n} departments leave; the company pays {c} more than with everyone in'],
      resCollapse: 'Everyone has left; the fixed cost stays with no one',
      resEmpty: 'Nobody is in; the fixed cost stays',
      resEmptyFree: 'Nobody is in; there is nothing to pay inside',
      foot: 'Variable cost a month: {u} per user, {m} per VM, {t} per TB, {k} per ticket.',
      illustrative: 'The amounts are made up but plausible.',
      pByUsers: 'By users',
      pByUsersHint: 'Customer support has the most people, so it carries the largest part: €15,919 of €39,480.',
      pByVms: 'By VMs',
      pByVmsHint: 'The same cost, another key: Development now carries 60%, and Customer support only €3,158.',
      pDevGrows: 'Development grows',
      pDevGrowsHint: 'Development doubles its usage, and everyone else\'s bill falls: the fixed part is spread over more VMs.',
      pCharged: 'Charged by storage',
      pChargedHint: 'Chargeback by TB: every bill is below its outside offer, so everyone stays.',
      pOneLeaves: 'Marketing leaves',
      pOneLeavesHint: 'Marketing goes to an outside provider; Accounting passes its offer and follows, then the chain stops.',
      pSpiral: 'The spiral',
      pSpiralHint: 'Charged by users: Customer support leaves, the price per user rises, and three more departments leave.',
      legCharged: 'bill (charged)',
      legShown: 'bill (shown)',
      legOwn: 'own variable cost',
      legOffer: 'outside offer',
      legOut: 'out: spent outside',
      legChanged: 'changed',
      legBase: 'everyone in',
      capShow: '{s} {k}: the shared {t} a month makes {u}. The bills are only shown: nobody pays them, so ' +
        'nobody leaves.',
      capStable: '{s} {k}: {u}. Every department pays no more than its outside offer, so everyone stays.',
      capSpiral1: '{s} {k}: {d} leaves, its bill {b} above its outside offer {q}. The fixed part of that bill ' +
        'stays with the rest: the price rises from {u0} to {u1}, but nobody else passes their offer.',
      capSpiralN: '{s} {k}: {d} leaves first, its bill {b} above its outside offer {q}. The fixed {f} stays, so ' +
        'the price rises from {u0} to {u1} and others follow: {m} in all.',
      capCollapse: '{s} {k}: {d} leaves first ({b} against an offer of {q}), and the rising price drives out ' +
        'every other department. The company still pays the fixed {f} for a platform nobody uses.',
      capEmpty: 'Every department is out: the company still pays the fixed {f} a month for a platform nobody uses, ' +
        'and {o} outside.',
      capEmptyFree: 'Every department is out, and with no fixed cost the shared platform costs nothing; the company pays ' +
        '{o} outside.',
      termShow: 'Showback',
      termCharge: 'Chargeback',
      nMore: ['{n} department', '{n} departments'],
      nWould: 'If charged, {d} would leave first: its bill {b} is above its outside offer {q}.',
      nForced: '{d} is out: the company saves only that department\'s own variable cost, {v}; the other {r} of its ' +
        'bill falls on the rest.',
      nForcedN: 'The departments that are out save the company only their own variable cost, {v}; in all, the other ' +
        '{r} of their bills falls on the rest.',
      nForcedSub: '{d} is out: its bill ({b}) was below its own variable cost ({v}), so the others now pay less.',
      nForcedSubN: 'Together, the bills of the departments that are out ({b}) were below their own variable cost ' +
        '({v}), so the others now pay {r} less in all.',
      nForcedEven: '{d} is out: its bill equalled its own variable cost ({v}), so the others pay the same.',
      nForcedEvenN: 'Together, the bills of the departments that are out equalled their own variable cost ({v}), so ' +
        'the others pay the same in all.',
      nTotal: 'The company as a whole pays {c} a month instead of {c0} with everyone in.',
      explain: '<p>A shared IT cost (the team, the data centre, base licences) has to be split between the ' +
        'departments somehow. The <b>allocation key</b> decides how: by users, VMs, terabytes or tickets. Each ' +
        'department pays the share of the total that equals its share of the key\'s units. The total is the same ' +
        'for every key; the key only decides who pays it.</p>' +
        '<p>Only the <b>variable costs</b> really follow usage. The <b>fixed costs</b> have no natural key: whichever ' +
        'is chosen, someone carries more than they cause. While most of the cost is fixed, one department growing lowers ' +
        'the price per unit for everyone else, and one leaving raises it. (With no fixed cost it can go the other ' +
        'way: a department with a high own cost per unit raises the price when it grows.)</p>' +
        '<p><b>Showback</b> only shows the departments their bill, and the cost stays in the IT budget. ' +
        '<b>Chargeback</b> moves the bill into the department\'s budget. Then a department compares its bill with ' +
        'an outside offer and, if the bill is dearer, buys outside.</p>' +
        '<p>A department that leaves saves the company only its variable cost. The fixed part of its bill stays and ' +
        'is split among the rest, so their <b>unit price</b> rises and the next department passes its offer: the ' +
        '<b>spiral</b>. In the end the company pays more than if everyone had stayed. The spiral stops when nobody ' +
        'passes their offer, and with a smaller fixed part it never starts.</p>' +
        '<p>In each round one department leaves, the one whose bill passes its offer by the most. Amounts are ' +
        'monthly; the fixed cost cannot be cut in the short run, and the outside offers do not depend on who ' +
        'stayed.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
