/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of cmp-shared-responsibility, in both languages (docs/sim-ui.md §9). Same keys in hr and en;
   the page looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is
   plural forms (hr: 1 / 2–4 / 5+, en: 1 / other). The title and subtitle come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Kontrole sustava narudžbi: tko ih vodi u kojem modelu, što misli tim i što dokazuje izvješće pružatelja',

      c_data: 'Podaci i s kim se dijele',
      c_ident: 'Računi, prijava, drugi faktor',
      c_access: 'Tko ima pristup čemu',
      c_backup: 'Sigurnosne kopije podataka',
      c_appupd: 'Ažuriranje aplikacije',
      c_appavail: 'Dostupnost aplikacije',
      c_ospatch: 'Zakrpe operacijskog sustava',
      c_osharden: 'Ojačavanje, admin. računi',
      c_hwfail: 'Kvarovi i rezervni dijelovi',
      c_disk: 'Brisanje diskova koji odlaze',
      c_phys: 'Ulaz u poslužiteljsku sobu',
      c_power: 'Napajanje, hlađenje, požar',

      g_data: 'nitko ne pazi što se unosi i dijeli',
      g_ident: 'računi bivših zaposlenika ostaju',
      g_access: 'prava se gomilaju bez pregleda',
      g_backup: 'brisanje valjanim računom je konačno',
      g_appupd: 'poznate ranjivosti ostaju otvorene',
      g_appavail: 'kad stane, nitko je ne podiže',
      g_ospatch: 'nitko ih ne instalira',
      g_osharden: 'zadane postavke ostaju kakve jesu',
      g_hwfail: 'pokvareni disk nitko ne mijenja',
      g_disk: 'isluženi diskovi odlaze s podacima',
      g_phys: 'nitko ne pazi tko ulazi',
      g_power: 'nitko ne pazi na struju i hlađenje',

      x_appupd: 'aplikaciju ažurira pružatelj',
      x_appavail: 'dostupnost drži pružatelj',
      x_ospatch: 'sustav krpa pružatelj',
      x_osharden: 'poslužitelji su pružateljevi',
      x_hwfail: 'hardver je pružateljev',
      x_disk: 'diskovi su u pružateljevu centru',
      x_phys: 'u pružateljevu zgradu ne ulazite',
      x_power: 'napajanje je pružateljevo',

      l_data: 'Podaci i pristup',
      l_app: 'Aplikacija',
      l_os: 'Operacijski sustav',
      l_hw: 'Hardver',
      l_site: 'Zgrada',

      m_own: 'Vlastiti',
      m_iaas: 'IaaS',
      m_paas: 'PaaS',
      m_saas: 'SaaS',
      mw_own: 'poslužitelji',
      mw_iaas: 'infrastruktura',
      mw_paas: 'platforma',
      mw_saas: 'aplikacija',
      ms_own: 'Vlastiti poslužitelji',
      ms_iaas: 'Iznajmljena infrastruktura (IaaS)',
      ms_paas: 'Platforma (PaaS)',
      ms_saas: 'Gotova aplikacija (SaaS)',
      mShow: 'Premjesti sustav: {name}',

      hLayer: 'Sloj',
      hControl: 'Kontrola',
      hBelief: 'Tim misli',
      hOutcome: 'Ishod',
      hReport: 'Izvješće',
      chipProv: 'pružatelj',
      chipCust: 'korisnik',
      beliefAria: '{name}: tim misli da je vodi {who}. Pritisni za promjenu.',
      rowAria: '{name} ({layer}): vodi {owner}; tim misli: {who}; ishod: {outcome}.',
      rowAriaRep: 'Izvješće: {ev}.',

      o_ok: 'poklapa se',
      o_gap: 'praznina',
      o_extra: 'dvostruko',
      e_proven: 'dokazano',
      e_carved: 'izuzeto',
      e_yours: 'nije u njemu',
      e_none: 'nema ga',
      repClosed: 'zatvoreno',

      kProv: 'Pružatelj vodi',
      kCust: 'Korisnik vodi',
      kOf: 'od {n}',
      kGap: 'Praznine',
      kGapSub: 'nitko ih ne vodi',
      kExtra: 'Dvostruki posao',
      kExtraSub: 'planirano, a tuđe',
      kRep: 'Izvješće pružatelja',
      kRepClosed: 'zatvoreno: pritisni za otvaranje',
      kRepOpen: 'dokazuje {p} · izuzeto {k} · nije u njemu {y}',
      kRepNone: 'nema pružatelja, nema izvješća',
      kRepAria: 'Izvješće pružatelja: {state}. Pritisni za otvaranje ili zatvaranje.',

      model: 'Gdje radi sustav narudžbi',
      opt_own: 'vlastito',
      opt_iaas: 'IaaS',
      opt_paas: 'PaaS',
      opt_saas: 'SaaS',
      mask: 'Uvjerenja tima',
      report: 'Izvješće pružatelja',
      carve: 'Izvješće bez zgrade',
      match: 'Označi prema ugovoru',

      pOwn: 'Vlastiti poslužitelji',
      pOwnHint: 'Sve kontrole vodi tvrtka; promijeni model i gledaj kako vlasnik prelazi.',
      pIaas: 'IaaS, točno označeno',
      pIaasHint: 'Pružatelj vodi zgradu i hardver, i tim je to tako označio.',
      pIaasOs: 'IaaS: „pružatelj krpa sustav”',
      pIaasOsHint: 'Nakon preseljenja tim misli da pružatelj krpa i operacijski sustav.',
      pSaasAll: 'SaaS: „pružatelj radi sve”',
      pSaasAllHint: 'Gotova aplikacija, a tim misli da je sve na pružatelju.',
      pSaasReport: 'SaaS i izvješće',
      pSaasReportHint: 'Računi i pristup su timu jasni, kopije prepušta aplikaciji; izvješće je otvoreno.',
      pCarve: 'Izvješće bez zgrade',
      pCarveHint: 'IaaS; pružatelj iznajmljuje podatkovni centar i izvješće ga izuzima.',

      legProv: 'vodi pružatelj',
      legCust: 'vodi korisnik',
      legGap: 'praznina: nitko',
      legExtra: 'dvostruki posao',
      legProven: 'izvješće dokazuje',
      legCarved: 'izuzeto: izvješće operatera',
      legYours: 'nije u izvješću',

      cap_own: '{m}: tvrtka vodi svih {c} kontrola, od zgrade do podataka.',
      cap_iaas: '{m}: pružatelj preuzima zgradu i hardver ({p} kontrole); operacijski sustav i sve iznad njega ostaje vama ({c}).',
      cap_paas: '{m}: pružatelj preuzima i operacijski sustav ({p} kontrola); aplikacija, podaci i pristup ostaju vama ({c}).',
      cap_saas: '{m}: pružatelj vodi i samu aplikaciju ({p} kontrola); podaci, računi, pristup i kopije ostaju vama ({c}).',
      nGap: ['{n} kontrolu nitko ne vodi: {name}, pa {what}.',
        '{n} kontrole nitko ne vodi. Prva, {name}: {what}.',
        '{n} kontrola nitko ne vodi. Prva, {name}: {what}.'],
      nNoReport: 'Na vlastitim poslužiteljima nema pružatelja ni njegova izvješća: dokaze za svih 12 kontrola čuvate sami.',
      nReport: 'Izvješće pružatelja dokazuje {p} od 12 kontrola, sve pružateljeve. Kontrole koje vodite vi ({c}) u njemu nisu: njihove dokaze čuvate sami.',
      nCarve: 'Izvješće dokazuje pružateljeve kontrole osim zgrade ({p} od 12): zgradu vodi operater podatkovnog centra i za nju treba njegovo izvješće ({k}). Vaših kontrola ({c}) nema ni u jednom.',
      nExtra: ['{n} kontrolu planirate, a vodi je pružatelj ({name}): dvostruki posao, a dokaz ionako dolazi izvana.',
        '{n} kontrole planirate, a vodi ih pružatelj (prva: {name}): dvostruki posao, a dokaz ionako dolazi izvana.',
        '{n} kontrola planirate, a vodi ih pružatelj (prva: {name}): dvostruki posao, a dokaz ionako dolazi izvana.'],
      nKeep: 'Podaci, računi, pristup i sigurnosne kopije ostaju vama u svakom modelu, i u tuđoj aplikaciji.',

      foot: 'Pojednostavljeno, nije pravni savjet. Tvrtka i njezin sustav narudžbi su izmišljeni; stvarni ugovori neke retke dijele ili granicu povlače drukčije.',

      explain:
        '<p>Kad mala web trgovina seli <b>sustav narudžbi</b> iz vlastite poslužiteljske sobe, pružatelj preuzima ' +
        'kontrole <b>sloj po sloj</b>: kod iznajmljene infrastrukture (<i>IaaS</i>) zgradu i hardver, kod platforme ' +
        '(<i>PaaS</i>) i operacijski sustav, kod gotove aplikacije (<i>SaaS</i>) i samu aplikaciju. To je ' +
        '<b>podijeljena odgovornost</b> (<i>shared responsibility</i>).</p>' +
        '<p>Gornji sloj nikad ne prelazi: <b>podaci</b> (što se unosi i s kim se dijeli), <b>računi</b> i ' +
        '<b>tko ima pristup</b>, te <b>sigurnosne kopije</b> vlastitih podataka, i u tuđoj aplikaciji. Pružatelj ' +
        'drži uslugu dostupnom; ako zaposlenik ili napadač s valjanim računom obriše ili šifrira podatke, aplikacija ' +
        'tu promjenu vjerno čuva. Koš za smeće s rokom nije sigurnosna kopija.</p>' +
        '<p><b>Praznina</b> nastaje gdje svaka strana misli da kontrolu vodi druga: tim označi kontrolu kao ' +
        'pružateljevu, a ugovor je ostavlja korisniku. Obrnuto je <b>dvostruki posao</b>: tim planira nešto do ' +
        'čega ne može doći (pružateljevu zgradu, njegove diskove), a dokaz ionako mora doći od pružatelja.</p>' +
        '<p><b>Izvješće neovisnog revizora o kontrolama pružatelja</b> (<i>assurance report</i>) dokaz je samo za ' +
        'pružateljev dio, u svom opsegu i razdoblju. Korisnikove kontrole u njemu se navode kao ' +
        '<b>komplementarne kontrole korisnika</b> (<i>complementary user entity controls</i>): izvješće pretpostavlja ' +
        'da ih vodite vi, a ne dokazuje ih. Ako pružatelj iznajmljuje podatkovni centar, izvješće može tog operatera ' +
        '<b>izuzeti</b> (<i>carve-out</i>); tada za zgradu treba i izvješće operatera. Isto vrijedi za certifikat: ' +
        'gledaj njegov opseg.</p>' +
        '<p>Kad pružatelj obrađuje osobne podatke, on je <b>izvršitelj obrade</b>, a tvrtka ostaje ' +
        '<b>voditelj obrade</b>: smije birati samo izvršitelje koji daju dovoljna jamstva i odgovara za obradu ' +
        '(Opća uredba o zaštiti podataka, čl. 24. i 28.); izvršitelj daje informacije potrebne za dokaz usklađenosti ' +
        'i omogućuje revizije (čl. 28. st. 3. t. (h)), a mjere sigurnosti provode oba (čl. 32.). NIS2 među ' +
        'obveznim mjerama navodi sigurnost lanca opskrbe (čl. 21. st. 2. t. (d)); DORA vrijedi za financijski ' +
        'sektor. Stranica pojednostavljuje: svaki redak ima jednog vlasnika, a stvarni ugovori neke retke dijele.</p>' +
        '<p>Srodno: rizik dobavljača i dubina provjere; trošak istog preseljenja (ugovorena potrošnja u oblaku).</p>' +
        '<p>Izvori: Uredba (EU) 2016/679 (Opća uredba o zaštiti podataka), čl. 24., 28. i 32.; Direktiva (EU) ' +
        '2022/2555 (NIS2), čl. 21.; ISO/IEC 27001:2022, kontrola 5.23 iz Priloga A; Uredba (EU) 2022/2554 (DORA), ' +
        'čl. 28.–30.; NIST SP 800-145 (modeli usluga u oblaku).</p>'
    },
    en: {
      stage: 'The order system\'s controls: who runs them in which model, what the team believes, and what the provider\'s report proves',

      c_data: 'Data and who sees it',
      c_ident: 'Accounts, sign-in, second factor',
      c_access: 'Who has access to what',
      c_backup: 'Backups of the data',
      c_appupd: 'Application updates',
      c_appavail: 'Application availability',
      c_ospatch: 'Operating system patches',
      c_osharden: 'Hardening, admin accounts',
      c_hwfail: 'Faults and spare parts',
      c_disk: 'Wiping retired disks',
      c_phys: 'Entry to the server room',
      c_power: 'Power, cooling, fire',

      g_data: 'nobody watches what goes in or out',
      g_ident: 'leavers\' accounts stay active',
      g_access: 'rights pile up, nobody reviews them',
      g_backup: 'a valid account\'s deletion is final',
      g_appupd: 'known holes stay open',
      g_appavail: 'when it stops, nobody restarts it',
      g_ospatch: 'nobody installs them',
      g_osharden: 'defaults stay as they came',
      g_hwfail: 'nobody replaces a failed disk',
      g_disk: 'retired disks leave with the data',
      g_phys: 'nobody controls who walks in',
      g_power: 'nobody minds power and cooling',

      x_appupd: 'the provider updates it; you cannot',
      x_appavail: 'the provider keeps it running',
      x_ospatch: 'the provider patches it',
      x_osharden: 'the servers are the provider\'s',
      x_hwfail: 'the hardware is the provider\'s',
      x_disk: 'the disks are the provider\'s',
      x_phys: 'you cannot enter the building',
      x_power: 'the power is the provider\'s',

      l_data: 'Data and access',
      l_app: 'Application',
      l_os: 'Operating system',
      l_hw: 'Hardware',
      l_site: 'Building',

      m_own: 'Own',
      m_iaas: 'IaaS',
      m_paas: 'PaaS',
      m_saas: 'SaaS',
      mw_own: 'servers',
      mw_iaas: 'infrastructure',
      mw_paas: 'platform',
      mw_saas: 'application',
      ms_own: 'Own servers',
      ms_iaas: 'Rented infrastructure (IaaS)',
      ms_paas: 'Platform (PaaS)',
      ms_saas: 'Finished application (SaaS)',
      mShow: 'Move the system: {name}',

      hLayer: 'Layer',
      hControl: 'Control',
      hBelief: 'Team believes',
      hOutcome: 'Outcome',
      hReport: 'Report',
      chipProv: 'provider',
      chipCust: 'customer',
      beliefAria: '{name}: the team believes the {who} runs it. Press to change.',
      rowAria: '{name} ({layer}): run by the {owner}; the team believes: {who}; outcome: {outcome}.',
      rowAriaRep: 'Report: {ev}.',

      o_ok: 'matches',
      o_gap: 'gap',
      o_extra: 'double',
      e_proven: 'proven',
      e_carved: 'carved out',
      e_yours: 'not in it',
      e_none: 'none',
      repClosed: 'closed',

      kProv: 'Provider runs',
      kCust: 'Customer runs',
      kOf: 'of {n}',
      kGap: 'Gaps',
      kGapSub: 'nobody runs them',
      kExtra: 'Double work',
      kExtraSub: 'planned, not yours',
      kRep: 'Provider\'s report',
      kRepClosed: 'closed: press to open',
      kRepOpen: 'proves {p} · carved out {k} · not in it {y}',
      kRepNone: 'no provider, no report',
      kRepAria: 'Provider\'s report: {state}. Press to open or close.',

      model: 'Where the order system runs',
      opt_own: 'own',
      opt_iaas: 'IaaS',
      opt_paas: 'PaaS',
      opt_saas: 'SaaS',
      mask: 'The team\'s beliefs',
      report: 'Provider\'s report',
      carve: 'Report without the building',
      match: 'Mark as the contract says',

      pOwn: 'Own servers',
      pOwnHint: 'The firm runs every control; change the model and watch the owner move.',
      pIaas: 'IaaS, marked right',
      pIaasHint: 'The provider runs the building and the hardware, and the team marked exactly that.',
      pIaasOs: 'IaaS: "the provider patches it"',
      pIaasOsHint: 'After the move the team believes the provider patches the operating system too.',
      pSaasAll: 'SaaS: "the provider does it all"',
      pSaasAllHint: 'A finished application, and the team believes everything is the provider\'s.',
      pSaasReport: 'SaaS and the report',
      pSaasReportHint: 'The team knows the accounts and access are its own, but leaves backups to the application; the report is open.',
      pCarve: 'The report without the building',
      pCarveHint: 'IaaS; the provider rents its data centre and the report carves it out.',

      legProv: 'the provider runs it',
      legCust: 'the customer runs it',
      legGap: 'gap: nobody',
      legExtra: 'double work',
      legProven: 'the report proves it',
      legCarved: 'carved out: the operator\'s report',
      legYours: 'not in the report',

      cap_own: '{m}: the firm runs all {c} controls, from the building to the data.',
      cap_iaas: '{m}: the provider takes the building and the hardware ({p} controls); the operating system and everything above it stay with you ({c}).',
      cap_paas: '{m}: the provider takes the operating system too ({p} controls); the application, the data and the access stay with you ({c}).',
      cap_saas: '{m}: the provider runs the application itself too ({p} controls); the data, the accounts, the access and the backups stay with you ({c}).',
      nGap: ['{n} control nobody runs: {name}, so {what}.',
        '{n} controls nobody runs. The first, {name}: {what}.'],
      nNoReport: 'On own servers there is no provider and no report: the evidence for all 12 controls is yours to keep.',
      nReport: 'The provider\'s report proves {p} of the 12 controls, all of them the provider\'s. The controls you run ({c}) are not in it: their evidence is yours to keep.',
      nCarve: 'The report proves the provider\'s controls except the building ({p} of 12): the data-centre operator runs the building, and its own report is needed for that ({k}). Your controls ({c}) are in neither.',
      nExtra: ['You plan {n} control the provider runs ({name}): double work, and the evidence has to come from outside anyway.',
        'You plan {n} controls the provider runs (first: {name}): double work, and the evidence has to come from outside anyway.'],
      nKeep: 'The data, the accounts, who has access and the backups stay with you in every model, even inside someone else\'s application.',

      foot: 'Simplified, not legal advice. The firm and its order system are made up; real contracts share some rows or draw the line elsewhere.',

      explain:
        '<p>When a small web shop moves its <b>order system</b> out of its own server room, the provider takes over ' +
        'controls <b>layer by layer</b>: with rented infrastructure (<i>IaaS</i>) the building and the hardware, ' +
        'with a platform (<i>PaaS</i>) the operating system too, with a finished application (<i>SaaS</i>) the ' +
        'application itself. That is <b>shared responsibility</b>.</p>' +
        '<p>The top layer never moves: the <b>data</b> (what goes in and who it is shared with), the ' +
        '<b>accounts</b> and <b>who has access</b>, and the <b>backups</b> of the firm\'s own data, even inside ' +
        'someone else\'s application. The provider keeps the service running; when an employee or an attacker with ' +
        'a valid account deletes or encrypts the data, the application faithfully keeps that change. A recycle bin ' +
        'with a time limit is not a backup.</p>' +
        '<p>A <b>gap</b> opens where each side believes the other runs a control: the team marks it as the ' +
        'provider\'s, and the contract leaves it with the customer. The reverse is <b>double work</b>: the team ' +
        'plans something it cannot reach (the provider\'s building, its disks), and the evidence has to come from ' +
        'the provider anyway.</p>' +
        '<p>The provider\'s <b>assurance report</b>, written by an independent auditor, is evidence for the ' +
        'provider\'s part only, within its scope and period. It lists the customer\'s controls as ' +
        '<b>complementary user entity controls</b>: the report assumes you run them, and does not prove them. When ' +
        'the provider rents its data centre, the report may <b>carve out</b> that operator; then the building needs ' +
        'the operator\'s report too. The same goes for a certificate: read its scope.</p>' +
        '<p>When the provider processes personal data it is a <b>processor</b> and the firm remains the ' +
        '<b>controller</b>: it may use only processors that give sufficient guarantees, and it answers for the ' +
        'processing (GDPR art. 24 and 28); the processor makes available the information needed to demonstrate ' +
        'compliance and allows audits (art. 28(3)(h)), and both take security measures (art. 32). NIS2 lists ' +
        'supply chain security among the required measures (art. 21(2)(d)); DORA applies to the financial sector. ' +
        'The page simplifies: each row has one owner, and real contracts share some rows.</p>' +
        '<p>Related: supplier risk and how deep to check; the cost of the same move (cloud commitment).</p>' +
        '<p>Sources: Regulation (EU) 2016/679 (GDPR), art. 24, 28 and 32; Directive (EU) 2022/2555 (NIS2), art. 21; ' +
        'ISO/IEC 27001:2022, Annex A control 5.23; Regulation (EU) 2022/2554 (DORA), art. 28–30; NIST SP 800-145 ' +
        '(cloud service models).</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
