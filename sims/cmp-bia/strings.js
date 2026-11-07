/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of cmp-bia, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks them
   up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural forms
   (hr: 1 / 2–4 / 5+, en: 1 / other). The title and subtitle come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Analiza utjecaja na poslovanje: procesi, aplikacije, infrastruktura',
      hours: '{n} h',
      days: ['{n} dan', '{n} dana', '{n} dana'],

      proc_orders: 'Primanje narudžbi',
      proc_dispatch: 'Otprema robe',
      proc_invoice: 'Fakturiranje',
      proc_payroll: 'Isplata plaća',
      proc_support: 'Podrška kupcima',
      sys_shop: 'Web trgovina',
      sys_erp: 'Poslovni sustav (ERP)',
      sys_wms: 'Skladišni sustav',
      sys_mail: 'E-pošta',
      sys_pay: 'Obračun plaća',
      sys_idm: 'Imenik i prijava',
      sys_dns: 'Razlučivanje imena (DNS)',
      sys_net: 'Mreža',
      short_shop: 'Trgovina',
      short_erp: 'ERP',
      short_wms: 'Skladište',
      short_mail: 'E-pošta',
      short_pay: 'Plaće',
      short_idm: 'Imenik',
      short_dns: 'DNS',
      short_net: 'Mreža',

      rowProcs: 'Poslovni procesi',
      rowApps: 'Aplikacije',
      rowInfra: 'Infrastruktura',
      mtd: 'MTD',
      today: 'danas',
      back: 'natrag za {t}',
      req: 'RTO ≤ {t}',
      reqFrom: 'od: {proc}',
      reqNone: 'RTO nije zadan',
      reqNoneWhy: 'nitko ga ne koristi izravno',
      reqUnused: 'nijedan proces ga ne treba',
      gap: '+{t}',
      needs: 'treba: {list}',
      needsNone: 'treba: ništa',
      linkBtn: 'Uredi ovisnosti: {name}',
      depOn: '{from} ovisi o: {to}. Klikni da makneš vezu.',
      depOff: '{from} ne ovisi o: {to}. Klikni da dodaš vezu.',
      selHint: 'Što treba {name}? Klikni sustave u redu ispod; ponovno klikni ⇣ za kraj.',
      mtdDown: 'Kraći MTD: {name}',
      mtdUp: 'Dulji MTD: {name}',
      achDown: 'Brža obnova danas: {name}',
      achUp: 'Sporija obnova danas: {name}',
      cardProc: '{name}: MTD {mtd}, natrag za {back}, {ok}',
      cardSys: '{name}: {req}, danas {ach}, {ok}, mjesto {pos} u redoslijedu',
      okWithin: 'na vrijeme',
      okLate: 'prekasno',
      okGap: 'jaz {t}',
      okNone: 'bez zahtjeva',

      kWithin: 'Procesi unutar MTD-a',
      kWithinAll: 'svi na vrijeme',
      kWithinLate: ['{n} kasni', '{n} kasne', '{n} kasni'],
      kWork: 'Lista poslova',
      kWorkSub: 'najveći jaz: {name} {gap}',
      kWorkNone: 'nijedan sustav nema jaz',
      kOrder: 'Redoslijed obnove',
      workItems: ['{n} sustav', '{n} sustava', '{n} sustava'],

      mode: 'Tko određuje RTO sustava',
      modeDirect: 'izravni korisnici',
      modeChain: 'cijeli lanac',
      modeHint: 'Samo procesi koji koriste sustav izravno, ili svi procesi iznad njega u grafu.',
      margin: 'Do odluke o obnovi',
      marginHint: 'Vrijeme da se prekid uoči i odluči o obnovi; oduzima se od MTD-a.',

      pDirect: 'Samo izravni korisnici',
      pDirectHint: 'Svaki sustav dobiva RTO samo od procesa koji ga koriste izravno.',
      pChain: 'Zahtjev teče niz lanac',
      pChainHint: 'Sustav nasljeđuje najkraći MTD svih procesa iznad sebe.',
      pHidden: 'Skrivena ovisnost',
      pHiddenHint: 'Web trgovina se ipak prijavljuje kroz imenik: jedna veza više.',
      pFixed: 'Lista poslova odrađena',
      pFixedHint: 'DNS se obnavlja za 2 h, imenik za 12 h.',
      pLate: 'Kasno uočeno',
      pLateHint: 'Do odluke o obnovi prođu 3 h: RTO-ovi se skraćuju.',

      legLine: 'ovisi o',
      legIgnored: 'analiza je ne prati',
      legOk: 'na vrijeme',
      legGap: 'jaz ili kašnjenje',
      legNone: 'bez RTO-a',
      legPos: 'redoslijed',

      capMain: '{ok} od {n} procesa vraća se unutar svog MTD-a. Lista poslova: {work}.',
      capEmpty: '{ok} od {n} procesa vraća se unutar svog MTD-a. Lista poslova je prazna.',
      workItem: '{name} {gap}',
      nUnrated: '{sys} nema RTO jer nijedan proces ne koristi taj sustav izravno, a {proc} čeka baš taj sustav: natrag za {back}, smije stajati {mtd}.',
      nUnratedAny: '{sys} nema RTO jer nijedan proces ne koristi taj sustav izravno, iako o tom sustavu ovise: {procs}.',
      nWaits: '{a} je u redoslijedu na mjestu {pa}, a sustav bez kojeg ne radi, {b}, tek na mjestu {pb}.',
      nMiss: '{proc}: natrag za {back}, a smije stajati {mtd}; najsporiji sustav u lancu: {sys}, {ach}.',
      nMargin: '{sys}: jaz otvara samo vrijeme do odluke ({m}); {ach} stane u MTD od {mtd}, ali ne u RTO od {req}.',
      nInherit: '{sys}: nijedan proces ne koristi taj sustav izravno, a nasljeđuje RTO {req} od procesa {proc} ({mtd} − {m}).',
      nAllOk: 'Nijedan sustav ne prekoračuje svoj RTO, pa se svaki proces vraća unutar MTD-a.',
      foot: 'Pojednostavljeno, nije pravni savjet. Tvrtka, sustavi i sati su izmišljeni; sustavi se obnavljaju usporedno.',

      explain:
        '<p><b>Analiza utjecaja na poslovanje</b> (<i>business impact analysis</i>, BIA) počinje od poslovnih ' +
        'procesa, ne od sustava: za svaki proces uprava odlučuje koliko smije stajati, <b>najdulji podnošljivi ' +
        'prekid</b> (<i>maximum tolerable downtime</i>, MTD).</p>' +
        '<ul>' +
        '<li>Sustav nasljeđuje <b>najkraći</b> MTD svih procesa koji o njemu ovise, izravno ili preko drugih ' +
        'sustava. Mrežu, razlučivanje imena i imenik nijedan proces ne koristi izravno, a trebaju ih gotovo svi, pa ' +
        'završe najhitniji.</li>' +
        '<li><b>Ciljno vrijeme oporavka</b> (<i>recovery time objective</i>, RTO) sustava mora biti kraće od ' +
        'tog MTD-a, za vrijeme koje prođe dok se prekid uoči i odluči o obnovi. Ovdje se RTO broji od odluke o ' +
        'obnovi, kako to čine mnogi IT timovi; broji li se od samog incidenta, uočavanje je dio RTO-a, a RTO ne ' +
        'smije prijeći MTD.</li>' +
        '<li>Razlika između potrebnog i danas postignutog vremena obnove je <b>lista poslova</b>; poredak po ' +
        'potrebnom RTO-u je <b>redoslijed obnove</b>, i tada svaki sustav dolazi nakon onih bez kojih ne radi.</li>' +
        '<li>Analiza koja pita samo izravne korisnike ostavlja infrastrukturu bez zahtjeva: lista poslova je ' +
        'prazna, a procesi i dalje kasne.</li>' +
        '</ul>' +
        '<p>Vremena na karticama pretpostavljaju da se sve obnavlja odjednom; redoslijed je prioritet kad ljudi i ruku ' +
        'nema dovoljno, a kad sustav može krenuti tek nakon drugoga, vremena se zbrajaju. ' +
        'Koliko podataka smije nestati (RPO) i cijena sati prekida su posebne teme. Srodno: RPO i RTO; skrivene ' +
        'ovisnosti; cijena zastoja.</p>' +
        '<p>Izvori: ISO 22301:2019, točka 8.2.2 (analiza utjecaja na poslovanje); ISO/IEC 27001:2022, kontrola ' +
        '5.30 (spremnost IKT-a za kontinuitet poslovanja); Direktiva (EU) 2022/2555 (NIS2), čl. 21. st. 2. t. (c) ' +
        '(kontinuitet poslovanja i oporavak od katastrofe); Uredba (EU) 2022/2554 (DORA), čl. 11.</p>'
    },
    en: {
      stage: 'Business impact analysis: processes, applications, infrastructure',
      hours: '{n} h',
      days: ['{n} day', '{n} days'],

      proc_orders: 'Taking orders',
      proc_dispatch: 'Dispatching goods',
      proc_invoice: 'Invoicing',
      proc_payroll: 'Paying salaries',
      proc_support: 'Customer support',
      sys_shop: 'Web shop',
      sys_erp: 'Business system (ERP)',
      sys_wms: 'Warehouse system',
      sys_mail: 'E-mail',
      sys_pay: 'Payroll system',
      sys_idm: 'Directory and sign-in',
      sys_dns: 'Name resolution (DNS)',
      sys_net: 'Network',
      short_shop: 'Shop',
      short_erp: 'ERP',
      short_wms: 'Warehouse',
      short_mail: 'E-mail',
      short_pay: 'Payroll',
      short_idm: 'Directory',
      short_dns: 'DNS',
      short_net: 'Network',

      rowProcs: 'Business processes',
      rowApps: 'Applications',
      rowInfra: 'Infrastructure',
      mtd: 'MTD',
      today: 'today',
      back: 'back in {t}',
      req: 'RTO ≤ {t}',
      reqFrom: 'from: {proc}',
      reqNone: 'no RTO set',
      reqNoneWhy: 'nobody uses it directly',
      reqUnused: 'no process needs it',
      gap: '+{t}',
      needs: 'needs: {list}',
      needsNone: 'needs: nothing',
      linkBtn: 'Edit dependencies: {name}',
      depOn: '{from} depends on: {to}. Click to remove the link.',
      depOff: '{from} does not depend on: {to}. Click to add the link.',
      selHint: 'What does {name} need? Click systems in the row below; click ⇣ again to finish.',
      mtdDown: 'Shorter MTD: {name}',
      mtdUp: 'Longer MTD: {name}',
      achDown: 'Faster recovery today: {name}',
      achUp: 'Slower recovery today: {name}',
      cardProc: '{name}: MTD {mtd}, back in {back}, {ok}',
      cardSys: '{name}: {req}, today {ach}, {ok}, number {pos} in the order',
      okWithin: 'in time',
      okLate: 'too late',
      okGap: 'gap {t}',
      okNone: 'no requirement',

      kWithin: 'Processes within MTD',
      kWithinAll: 'all in time',
      kWithinLate: ['{n} late', '{n} late'],
      kWork: 'Work list',
      kWorkSub: 'largest gap: {name} {gap}',
      kWorkNone: 'no system has a gap',
      kOrder: 'Recovery order',
      workItems: ['{n} system', '{n} systems'],

      mode: 'Who sets a system\'s RTO',
      modeDirect: 'direct users',
      modeChain: 'the whole chain',
      modeHint: 'Only the processes that use a system directly, or every process above it in the graph.',
      margin: 'Until the decision to restore',
      marginHint: 'Time to notice the outage and decide to restore; it comes off the MTD.',

      pDirect: 'Direct users only',
      pDirectHint: 'Each system gets an RTO only from the processes that use it directly.',
      pChain: 'Requirements flow down',
      pChainHint: 'A system inherits the shortest MTD of every process above it.',
      pHidden: 'A hidden dependency',
      pHiddenHint: 'The web shop signs in through the directory after all: one more link.',
      pFixed: 'Work list done',
      pFixedHint: 'Name resolution restored in 2 h, the directory in 12 h.',
      pLate: 'Noticed late',
      pLateHint: 'Three hours pass before the decision to restore: the RTOs shrink.',

      legLine: 'depends on',
      legIgnored: 'ignored by the analysis',
      legOk: 'in time',
      legGap: 'gap or late',
      legNone: 'no RTO',
      legPos: 'order',

      capMain: '{ok} of {n} processes are back within their MTD. Work list: {work}.',
      capEmpty: '{ok} of {n} processes are back within their MTD. The work list is empty.',
      workItem: '{name} {gap}',
      nUnrated: '{sys} has no RTO because no process uses it directly, yet {proc} waits for it: back in {back}, may be down for {mtd}.',
      nUnratedAny: '{sys} has no RTO because no process uses it directly, although these depend on it: {procs}.',
      nWaits: '{a} is number {pa} in the order, but {b}, which it cannot run without, is only number {pb}.',
      nMiss: '{proc}: back in {back}, but may be down for {mtd}; the slowest system in its chain: {sys}, {ach}.',
      nMargin: '{sys}: the gap comes only from the time to decide ({m}); {ach} fits the MTD of {mtd}, not the RTO of {req}.',
      nInherit: '{sys}: no process uses it directly, yet it inherits an RTO of {req} from {proc} ({mtd} − {m}).',
      nAllOk: 'No system misses its RTO, so every process is back within its MTD.',
      foot: 'Simplified, not legal advice. The firm, its systems and the hours are made up; systems are restored in parallel.',

      explain:
        '<p>A <b>business impact analysis</b> (BIA) starts from the business processes, not from the systems: for ' +
        'each process management decides how long it may stop, its <b>maximum tolerable downtime</b> (MTD).</p>' +
        '<ul>' +
        '<li>A system inherits the <b>shortest</b> MTD of every process that depends on it, directly or through ' +
        'other systems. No process uses the network, name resolution or the directory directly, yet almost all of ' +
        'them need them, so these end up most urgent.</li>' +
        '<li>A system\'s <b>recovery time objective</b> (RTO) must be shorter than that MTD, by the time it takes ' +
        'to notice the outage and decide to restore. Here the RTO is counted from the decision to restore, as many IT ' +
        'teams do; counted from the incident, the time to notice is part of the RTO and the RTO must not exceed the ' +
        'MTD.</li>' +
        '<li>The difference between the required and today\'s achieved recovery time is the <b>work list</b>; ' +
        'sorting by required RTO gives the <b>recovery order</b>, and then every system comes after the ones it ' +
        'cannot run without.</li>' +
        '<li>An analysis that asks only the direct users leaves the infrastructure without a requirement: the work ' +
        'list is empty and the processes are still late.</li>' +
        '</ul>' +
        '<p>The times on the cards assume everything is restored at once; the order is the priority when people and ' +
        'hands are short, and when one system can only start after another, the times add up. How much data may be lost (RPO) and the price of the hours down are separate topics. Related: RPO and ' +
        'RTO; hidden dependencies; the cost of downtime.</p>' +
        '<p>Sources: ISO 22301:2019, clause 8.2.2 (business impact analysis); ISO/IEC 27001:2022, control 5.30 ' +
        '(ICT readiness for business continuity); Directive (EU) 2022/2555 (NIS2), art. 21(2)(c) (business ' +
        'continuity and disaster recovery); Regulation (EU) 2022/2554 (DORA), art. 11.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
