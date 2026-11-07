/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of fin-fixed-variable, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   The title and subtitle come from sim.json. Numbers are formatted in the page (index.html) and passed in. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Vlastita platforma i usluga po korisniku: trošak mjesečno i trošak po korisniku prema broju korisnika',
      users: 'Korisnici',
      util: 'Ciljana iskorištenost bloka',
      fixed: 'Fiksni trošak platforme',
      price: 'Cijena usluge po korisniku',
      nUsers: ['{n} korisnik', '{n} korisnika', '{n} korisnika'],
      nBlocks: ['{n} blok', '{n} bloka', '{n} blokova'],
      nPlaces: ['{n} mjesto', '{n} mjesta', '{n} mjesta'],
      eur: '{n}\u00a0€',
      pct: '{n} %',
      perMonth: '{v} mjesečno',
      perUser: '{v} po korisniku',
      headCost: 'Trošak mjesečno',
      headAvg: 'Trošak po korisniku mjesečno',
      axisUsers: 'korisnika',
      zoneTag: 'točka pokrića {a}–{b}',
      beTag: 'točka pokrića {a}',
      edgeTag: 'novi blok +{s}',
      offTop: '↑ {v}',
      cardIn: 'Vlastita platforma',
      cardSvc: 'Usluga po korisniku',
      cardAvg: 'Po korisniku',
      cardBe: 'Točka pokrića',
      lineFixed: 'fiksno {v}',
      lineSteps: '{b} × {s} = {v}',
      lineVar: '{n} × {v} = {t}',
      lineIdle: 'neiskorišteno: {p}, {v}',
      lineHot: 'malo rezerve: blizu punog rastu čekanja',
      lineSvc: '{n} × {p}',
      avgBig: 'prosjek {v}',
      avgNone: 'nema korisnika',
      avgParts: 'fiksno {f} + blokovi {s} + rad {v}',
      nextEdge: 'sljedeći: {m}, otvara {k}. blok',
      nextPlain: 'sljedeći: {m}',
      beRange: '{a}–{b} korisnika',
      beNever: 'nikad jeftinija',
      beFirst: 'nije skuplja tik prije bloka od {a}, trajno od {b}',
      beOne: 'nije skuplja od {a} korisnika naviše',
      beNo: 'puni blok {c} po korisniku, usluga {p}',
      beTextbook: 'udžbenički: {f} ÷ {m} = {n}',
      beTextbookApprox: 'udžbenički: {f} ÷ {m} ≈ {n}',
      beTextbookNone: 'udžbenički: marža po korisniku {m}, nema točke',
      resIn: 'Vlastita platforma jeftinija je za {d} mjesečno',
      resSvc: 'Usluga je jeftinija za {d} mjesečno',
      resEven: 'Obje koštaju jednako',
      resNone: 'Bez korisnika ostaje samo fiksni trošak',
      resNoneFree: 'Bez korisnika i bez fiksnog troška nema se što platiti',
      foot: 'Blok kapaciteta {s} mjesečno za {k} korisnika pri punoj iskorištenosti; rad {v} po korisniku mjesečno.',
      illustrative: 'Iznosi su izmišljeni, ali uvjerljivi.',
      pFewUsers: 'Malo korisnika',
      pFewUsersHint: 'Sto korisnika: fiksni trošak dijeli se na malo njih i prosjek je 42 € po korisniku.',
      pStepEdge: 'Na rubu bloka',
      pStepEdgeHint: 'Četiristo korisnika popunilo je pet blokova: sljedeći otvara šesti i košta 502 €.',
      pGrown: 'Tisuću korisnika',
      pGrownHint: 'Fiksni trošak raspoređen na mnogo korisnika: vlastita platforma postaje jeftinija od usluge.',
      pHeadroom: 'Puno rezerve',
      pHeadroomHint: 'Blokovi se pune samo do pola: neiskorištena polovica košta i vlastita se nikad ne isplati.',
      pRunHot: 'Blokovi do vrha',
      pRunHotHint: 'Blokovi se pune do kraja: točka pokrića pada na 600–650, ali nema rezerve za vršno opterećenje.',
      legIn: 'vlastita platforma',
      legSvc: 'usluga po korisniku',
      legFixed: 'fiksni trošak',
      legMarg: 'sljedeći korisnik',
      legZone: 'točka pokrića',
      legNow: 'odabrani broj korisnika',
      legChanged: 'promijenio se ishod',
      capNone: 'Još nema korisnika: vlastita platforma i dalje košta fiksnih {f} mjesečno, a usluga ništa.',
      capNoneFree: 'Još nema korisnika, a bez fiksnog troška ni vlastita platforma ni usluga ne koštaju ništa.',
      capInhouse: '{n}: vlastita platforma košta {c} mjesečno ({a} po korisniku), usluga {s} ({p} po korisniku). ' +
        'Vlastita je jeftinija za {d}.',
      capService: '{n}: vlastita platforma košta {c} mjesečno ({a} po korisniku), usluga {s} ({p} po korisniku). ' +
        'Usluga je jeftinija za {d}.',
      capEven: '{n}: vlastita platforma i usluga koštaju jednako, {c} mjesečno ({a} po korisniku).',
      nEdge: 'Sljedeći korisnik otvara {k}. blok i košta {m}, a ne prosječnih {a}.',
      nNext: 'Sljedeći korisnik košta samo {m}: prosjek od {a} većinom su fiksni trošak i blokovi raspoređeni na sve.',
      nBe: 'Vlastita platforma nije skuplja od {b} korisnika naviše.',
      nZone: 'Točka pokrića nije jedan broj: od {e} korisnika vlastita nije skuplja tik prije svakog novog bloka, ' +
        'a trajno od {b}.',
      nNever: 'Uz ovu cijenu i iskorištenost od {u} vlastita nikad nije jeftinija: puni blok košta {c} po korisniku ' +
        '(blok i rad), ne manje od usluge ({p}), pa ništa ne ostaje za fiksni trošak.',
      explain: '<p><b>Fiksni troškovi</b> ne ovise o broju korisnika: dio vremena tima, osnovne licence, nadzor. ' +
        '<b>Varijabilni troškovi</b> rastu sa svakim korisnikom (prostor, podrška). <b>Stepenasti troškovi</b> ' +
        'su između: kapacitet se kupuje u blokovima (poslužitelj sa svojim diskovima, napajanjem i podrškom), pa trošak ' +
        'stoji dok se blok ne napuni, a onda skoči.</p>' +
        '<p><b>Prosječni trošak</b> po korisniku je ukupni trošak podijeljen brojem korisnika. Fiksni dio pada kako ' +
        'korisnika ima više, pa vlastita platforma postaje jeftinija po korisniku. <b>Granični trošak</b> je ono što ' +
        'doda sljedeći korisnik: obično samo varijabilni trošak (ovdje 2 €), daleko ispod prosjeka, a kad otvara novi ' +
        'blok, cijeli blok (502 €). Tko pita „koliko košta još jedan korisnik?”, treba granični, ne prosječni trošak.</p>' +
        '<p><b>Točka pokrića</b> je broj korisnika pri kojem vlastita platforma košta koliko i usluga. Udžbenička ' +
        'formula: fiksni trošak ÷ marža po korisniku, gdje je marža cijena usluge umanjena za varijabilni trošak i ' +
        'trošak bloka po korisniku. Sa stepenastim troškom to nije jedna točka nego pojas: vlastita je jeftinija tik ' +
        'prije svakog novog bloka, a tek od nekog broja korisnika trajno.</p>' +
        '<p><b>Iskorištenost</b> odlučuje koliko blok stoji po korisniku. Neiskorištena rezerva košta: pri 50 % plaćaš ' +
        'dvostruki kapacitet i usluga može uvijek biti jeftinija. Premalo rezerve košta drugačije: blizu pune ' +
        'iskorištenosti čekanja naglo rastu (simulator „Kašnjenje pri gotovo punoj iskorištenosti”).</p>' +
        '<p>Iznosi su mjesečni, bez ulaganja i amortizacije (to su zasebne stranice), a cijena usluge ne pada s ' +
        'količinom.</p>'
    },
    en: {
      stage: 'An in-house platform and a per-user service: cost a month and cost per user against the number of users',
      users: 'Users',
      util: 'Target utilisation of a block',
      fixed: 'Fixed cost of the platform',
      price: 'Service price per user',
      nUsers: ['{n} user', '{n} users'],
      nBlocks: ['{n} block', '{n} blocks'],
      nPlaces: ['{n} place', '{n} places'],
      eur: '€{n}',
      pct: '{n}%',
      perMonth: '{v} a month',
      perUser: '{v} per user',
      headCost: 'Cost a month',
      headAvg: 'Cost per user a month',
      axisUsers: 'users',
      zoneTag: 'break-even {a}–{b}',
      beTag: 'break-even {a}',
      edgeTag: 'new block +{s}',
      offTop: '↑ {v}',
      cardIn: 'Running it yourself',
      cardSvc: 'Per-user service',
      cardAvg: 'Per user',
      cardBe: 'Break-even',
      lineFixed: 'fixed {v}',
      lineSteps: '{b} × {s} = {v}',
      lineVar: '{n} × {v} = {t}',
      lineIdle: 'idle: {p}, {v}',
      lineHot: 'little headroom: waits grow near full',
      lineSvc: '{n} × {p}',
      avgBig: 'average {v}',
      avgNone: 'no users yet',
      avgParts: 'fixed {f} + blocks {s} + running {v}',
      nextEdge: 'next: {m}, opens block {k}',
      nextPlain: 'next: {m}',
      beRange: '{a}–{b} users',
      beNever: 'never cheaper',
      beFirst: 'no dearer just before a block from {a}, for good from {b}',
      beOne: 'no dearer from {a} users on',
      beNo: 'a full block {c} per user, the service {p}',
      beTextbook: 'textbook: {f} ÷ {m} = {n}',
      beTextbookApprox: 'textbook: {f} ÷ {m} ≈ {n}',
      beTextbookNone: 'textbook: margin per user {m}, no point',
      resIn: 'Running it yourself is cheaper by {d} a month',
      resSvc: 'The service is cheaper by {d} a month',
      resEven: 'Both cost the same',
      resNone: 'With no users only the fixed cost is left',
      resNoneFree: 'With no users and no fixed cost there is nothing to pay',
      foot: 'A capacity block costs {s} a month for {k} users at full utilisation; running costs {v} per user a month.',
      illustrative: 'The amounts are made up but plausible.',
      pFewUsers: 'Few users',
      pFewUsersHint: 'A hundred users: the fixed cost is shared by few, and the average is €42 per user.',
      pStepEdge: 'At a block\'s edge',
      pStepEdgeHint: 'Four hundred users have filled five blocks: the next one opens the sixth and costs €502.',
      pGrown: 'A thousand users',
      pGrownHint: 'The fixed cost spread over many users: running it yourself becomes cheaper than the service.',
      pHeadroom: 'Plenty of headroom',
      pHeadroomHint: 'Blocks are filled only halfway: the idle half costs money, and in-house never pays.',
      pRunHot: 'Blocks filled to the top',
      pRunHotHint: 'Blocks are filled all the way: break-even falls to 600–650, but no headroom is left for peaks.',
      legIn: 'in-house platform',
      legSvc: 'per-user service',
      legFixed: 'fixed cost',
      legMarg: 'the next user',
      legZone: 'break-even',
      legNow: 'chosen number of users',
      legChanged: 'the outcome changed',
      capNone: 'No users yet: the in-house platform still costs its fixed {f} a month, and the service nothing.',
      capNoneFree: 'No users yet, and with no fixed cost neither the in-house platform nor the service costs anything.',
      capInhouse: '{n}: running it yourself costs {c} a month ({a} per user), the service {s} ({p} per user). ' +
        'In-house is cheaper by {d}.',
      capService: '{n}: running it yourself costs {c} a month ({a} per user), the service {s} ({p} per user). ' +
        'The service is cheaper by {d}.',
      capEven: '{n}: running it yourself and the service cost the same, {c} a month ({a} per user).',
      nEdge: 'The next user opens block {k} and costs {m}, not the average {a}.',
      nNext: 'The next user costs only {m}: the average {a} is mostly the fixed cost and the blocks, spread over everyone.',
      nBe: 'Running it yourself is no dearer from {b} users on.',
      nZone: 'Break-even is not one number: from {e} users in-house is no dearer just before each new block, and for ' +
        'good from {b}.',
      nNever: 'At this price and {u} utilisation in-house is never cheaper: a full block costs {c} per user (block ' +
        'and running), no less than the service\'s {p}, so nothing is left for the fixed cost.',
      explain: '<p><b>Fixed costs</b> do not depend on the number of users: a share of the team\'s time, base licences, ' +
        'monitoring. <b>Variable costs</b> grow with every user (space, support). <b>Step costs</b> sit in between: ' +
        'capacity is bought in blocks (a server with its disks, power and support), so the cost stays flat until a ' +
        'block is full and then jumps.</p>' +
        '<p>The <b>average cost</b> per user is the total divided by the number of users. Its fixed share falls as ' +
        'users grow, so the in-house platform gets cheaper per user. The <b>marginal cost</b> is what the next user ' +
        'adds: usually only the variable cost (here €2), far below the average, and when it opens a new block, the ' +
        'whole block (€502). Asked "what does one more user cost?", give the marginal cost, not the average.</p>' +
        '<p>The <b>break-even point</b> is the number of users at which running it yourself costs as much as the ' +
        'service. The textbook formula: fixed cost ÷ margin per user, the margin being the service\'s price less the ' +
        'variable cost and the block\'s cost per user. With step costs it is a zone, not a point: in-house is cheaper ' +
        'just before each new block, and only from some number of users on for good.</p>' +
        '<p><b>Utilisation</b> decides what a block costs per user. Idle headroom costs money: at 50% you pay for ' +
        'twice the capacity, and the service may always be cheaper. Too little headroom costs differently: near full ' +
        'utilisation waiting times grow steeply (the simulator "Latency near full utilisation").</p>' +
        '<p>All amounts are monthly, without the investment and depreciation (separate pages), and the service\'s ' +
        'price does not fall with volume.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
