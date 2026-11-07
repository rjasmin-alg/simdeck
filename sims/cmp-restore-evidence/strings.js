/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the page, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural forms
   (hr: 1 / 2–4 / 5+, en: 1 / other). The title and subtitle are not here: they come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Plan testova obnove za godinu, izvještaji o kopiranju i dokazi koje dobiva revizor',

      sys_files: 'Datoteke', sys_mail: 'E-pošta', sys_wiki: 'Intranet', sys_shop: 'Web trgovina',
      sys_print: 'Ispis', sys_pay: 'Plaće', sys_wms: 'Skladište', sys_crm: 'Baza kupaca',
      sys_dev: 'Razvoj', sys_erp: 'ERP', sys_idm: 'Imenik i prijava',
      sys_arch: 'Arhiva',
      tier_1: 'kritičan', tier_2: 'važan', tier_3: 'manje važan',
      q: '{n}. tromj.',
      qLong: '{n}. tromjesečju',
      hours: '{h} h',
      mon_2: 'veljače', mon_5: 'svibnja', mon_8: 'kolovoza', mon_11: 'studenoga',
      date: '{d}. {mon}',

      // the grid
      colSystem: 'Sustav',
      colRto: 'RTO',
      colJobs: 'Kopija',
      colYear: 'Godina',
      jobsCell: '✓ 365',
      slotsUsed: '{n}/{s}',
      gridHint: 'Klikni ćeliju: dodaj ili makni test.',
      cellAdd: '{sys}, {q}: dodaj test',
      cellRemove: '{sys}, {q}: makni test',
      yNever: 'nije testiran',
      yOk: '✓ u roku',
      ySlow: '⏱ iznad RTO',
      yFail: '✗ propala',
      yDone: '? bez vremena',
      yTruthFail: 'stvarno: ✗',
      yTruthSlow: 'stvarno: {t}',

      // the tiles
      kJobs: 'Izvještaji o kopiranju',
      kJobsSub: '{n} od {n} uspješno',
      kTested: 'Testirani sustavi',
      kTestedSub: 'nikad: {n} (kritičnih {c})',
      kFail: 'Neuspjele obnove',
      kFailSub: 'nađeno / stvarno',
      kSlow: 'Sporije od RTO',
      kSlowSub: 'pokazano / stvarno',
      kSlowTicket: 'nije mjereno',

      // the record
      recHead: 'Zapis koji dobiva revizor',
      recFull: 'Zapis o testu obnove',
      recTicket: 'Zatvoren zahtjev: „test obnove obavljen”',
      recNone: 'Nema nijednog zapisa o obnovi: revizor dobiva samo izvještaje da je kopiranje uspjelo.',
      fDate: 'Datum',
      fSystem: 'Sustav',
      fScope: 'Opseg',
      fTime: 'Trajanje',
      fResult: 'Rezultat',
      fSign: 'Potpis',
      vScope: 'cijeli sustav, na izolirano računalo',
      vTime: '{t} uz RTO {rto}',
      vOk: 'vraćen',
      vFail: 'obnova ne uspijeva',
      vDone: 'obavljeno',
      vSign: 'vlasnik sustava',
      vMissing: 'nema',

      // the findings
      findHead: 'Nalazi revizora',
      fNever: ['Nije testiran: {n} sustav', 'Nisu testirana: {n} sustava', 'Nije testirano: {n} sustava'],
      fNeverCrit: 'kritičnih {c}',
      fFailed: 'Obnova nije uspjela, ponovnog testa nema',
      fSlow: 'Vraćeno, ali sporije od RTO',
      fUnproven: ['{n} zapis bez trajanja i potpisa: RTO nije dokazan', '{n} zapisa bez trajanja i potpisa: RTO nije dokazan', '{n} zapisa bez trajanja i potpisa: RTO nije dokazan'],
      fNone: 'Nema nalaza: svaki sustav vraćen u roku, svaki zapis potpun.',
      andMore: 'i još {n}',

      // params, presets, legend
      slots: 'Termina za test po tromjesečju',
      order: 'Redoslijed',
      orderCrit: 'kritični prvi',
      orderList: 'po popisu',
      orderEasy: 'najbrži prvi',
      orderOwn: 'vlastiti',
      record: 'Što ostaje zapisano',
      recordFull: 'potpun zapis',
      recordTicket: '„obavljeno”',
      pJobs: 'Samo izvještaji o kopiranju',
      pJobsHint: 'Nijedan test obnove: sve je zeleno, a ništa nije dokazano.',
      pList: 'Dva termina, po popisu',
      pListHint: 'Testira se redom kojim su sustavi upisani: kritični s kraja popisa ne dođu na red.',
      pCrit: 'Dva termina, kritični prvi',
      pCritHint: 'Isti broj testova: netestirani su sada oni najmanje važni.',
      pEasy: 'Najbrži prvi',
      pEasyHint: 'Prvo ono što se brzo vrati: spori sustavi nikad nisu testirani.',
      pAll: 'Tri termina: cijelo okruženje',
      pAllHint: 'Dvanaest testova za dvanaest sustava: svaki jednom u godini, kako traži standard tvrtke.',
      pTicket: 'Zapis samo „obavljeno”',
      pTicketHint: 'Isti testovi, ali zahtjev nema trajanje ni potpis.',
      legOk: 'vraćen u roku',
      legSlow: 'vraćen sporije od RTO',
      legFail: 'obnova ne uspijeva',
      legNever: 'nije testiran',
      legDone: 'zapis bez vremena',
      rejFull: '{q} je popunjeno ({s} termina): makni neki test ili dodaj termin.',
      rejNone: 'Nema termina za testove: dodaj ih u postavkama.',

      // the caption
      nTests: ['{n} test', '{n} testa', '{n} testova'],
      capNone: 'Izvještaji o kopiranju cijelu su godinu zeleni ({jobs} uspješnih), a nijedna obnova nije isprobana: ništa ne pokazuje da se ijedan sustav može vratiti.',
      capAll: 'Svih {n} sustava testirano je barem jednom u godini, kako traži standard tvrtke ({tests}).',
      capSome: 'Testirano je {tested} od {n} sustava ({tests}); nikad {never}, nijedan od njih kritičan.',
      capSomeCrit: 'Testirano je {tested} od {n} sustava ({tests}); nikad {never}, od toga kritičnih {crit}.',
      nTicket: 'Zahtjevi kažu samo „obavljeno”: bez trajanja i potpisa nijedan zapis ne pokazuje da je obnova stala u RTO.',
      nHidden: '{name}: izvještaj o kopiranju zelen je cijelu godinu, a obnova bi propala. Nitko to ne zna.',
      nFound: '{name}: izvještaj o kopiranju bio je zelen, a obnova je propala na testu u {q}.',
      nSlow: '{name}: obnova je trajala {t}, a RTO je {rto}. Uspjela je, a ipak je nalaz.',
      nSlowHidden: '{name}: obnova bi trajala {t} uz RTO od {rto}; sustav nije testiran, pa to nitko ne zna.',

      foot: 'Pojednostavljeno, nije pravni savjet. Tvrtka, sustavi i brojevi su izmišljeni.',

      explain:
        '<p>Da [[backup]] radi, ne dokazuje izvještaj da je kopiranje uspjelo, nego <b>test obnove</b> ' +
        '(<i>restore test</i>): sustav vraćen iz kopije na izolirano računalo, provjeren i izmjeren. Standard ove izmišljene tvrtke: ' +
        'svaki sustav barem jednom godišnje.</p>' +
        '<ul>' +
        '<li>Termina je malo, pa <b>redoslijed</b> odlučuje koji sustavi nikad ne dođu na red. Kritični prvi: ' +
        'netestirani su oni najmanje važni, i to se vidi u planu. Po popisu ili najbrži prvi: može ostati ' +
        'kritičan sustav, a najbrži prvi preskače baš one spore.</li>' +
        '<li>Svaki test ostavlja <b>zapis</b>: datum, opseg, trajanje uz <b>ciljno vrijeme oporavka</b> ' +
        '(<i>recovery time objective</i>, RTO), rezultat i potpis vlasnika sustava. To je dokaz koji revizor ' +
        'dobiva; zahtjev koji kaže samo „obavljeno” ne dokazuje RTO.</li>' +
        '<li>Obnova sporija od RTO-a je <b>nalaz</b> (<i>finding</i>) i kad uspije: posao se ne bi vratio na vrijeme.</li>' +
        '<li>Neuspjeli test nije loš ishod: kontrola je otkrila kopiju koja ne vrijedi. Popravak treba ponovni test.</li>' +
        '</ul>' +
        '<p>Srodno: obnova koja laže; RPO i RTO; analiza utjecaja na poslovanje (odakle RTO); politika, standard, ' +
        'procedura, zapis.</p>' +
        '<p>Odakle: ISO/IEC 27001:2022, kontrola 8.13 (sigurnosne kopije informacija) i točka 7.5 (dokumentirane ' +
        'informacije); NIS2, Direktiva (EU) 2022/2555, čl. 21. st. 2. t. (c): upravljanje sigurnosnim kopijama i ' +
        'oporavak od katastrofe; Opća uredba o zaštiti podataka (EU) 2016/679, čl. 32. st. 1. t. (c) i (d): ' +
        'pravodobna ponovna uspostava dostupnosti i redovito testiranje mjera.</p>'
    },

    en: {
      stage: 'A year\'s restore test plan, the backup job reports and the evidence the auditor receives',

      sys_files: 'File server', sys_mail: 'E-mail', sys_wiki: 'Intranet', sys_shop: 'Web shop',
      sys_print: 'Printing', sys_pay: 'Payroll', sys_wms: 'Warehouse', sys_crm: 'Customer data',
      sys_dev: 'Development', sys_erp: 'ERP', sys_idm: 'Directory',
      sys_arch: 'Archive',
      tier_1: 'critical', tier_2: 'important', tier_3: 'less important',
      q: 'Q{n}',
      qLong: 'Q{n}',
      hours: '{h} h',
      mon_2: 'Feb', mon_5: 'May', mon_8: 'Aug', mon_11: 'Nov',
      date: '{d} {mon}',

      colSystem: 'System',
      colRto: 'RTO',
      colJobs: 'Backup',
      colYear: 'Year',
      jobsCell: '✓ 365',
      slotsUsed: '{n}/{s}',
      gridHint: 'Click a cell to add or remove a test.',
      cellAdd: '{sys}, {q}: add a test',
      cellRemove: '{sys}, {q}: remove the test',
      yNever: 'never tested',
      yOk: '✓ within RTO',
      ySlow: '⏱ over RTO',
      yFail: '✗ failed',
      yDone: '? no time',
      yTruthFail: 'really: ✗',
      yTruthSlow: 'really: {t}',

      kJobs: 'Backup job reports',
      kJobsSub: '{n} of {n} successful',
      kTested: 'Systems tested',
      kTestedSub: 'never: {n} ({c} critical)',
      kFail: 'Failed restores',
      kFailSub: 'found / really',
      kSlow: 'Slower than RTO',
      kSlowSub: 'shown / really',
      kSlowTicket: 'not measured',

      recHead: 'A record the auditor receives',
      recFull: 'Restore test record',
      recTicket: 'Closed ticket: "restore test done"',
      recNone: 'Not one restore record: the auditor receives only reports that the backup jobs succeeded.',
      fDate: 'Date',
      fSystem: 'System',
      fScope: 'Scope',
      fTime: 'Time taken',
      fResult: 'Result',
      fSign: 'Signed off',
      vScope: 'whole system, onto an isolated host',
      vTime: '{t}, RTO {rto}',
      vOk: 'restored',
      vFail: 'restore fails',
      vDone: 'done',
      vSign: 'system owner',
      vMissing: 'none',

      findHead: 'The auditor\'s findings',
      fNever: ['Never tested: {n} system', 'Never tested: {n} systems'],
      fNeverCrit: '{c} critical',
      fFailed: 'Restore failed, no retest',
      fSlow: 'Restored, but slower than the RTO',
      fUnproven: ['{n} record without time or sign-off: RTO not shown', '{n} records without time or sign-off: RTO not shown'],
      fNone: 'No findings: every system restored within its RTO, every record complete.',
      andMore: 'and {n} more',

      slots: 'Test slots per quarter',
      order: 'Order',
      orderCrit: 'critical first',
      orderList: 'as listed',
      orderEasy: 'quickest first',
      orderOwn: 'own plan',
      record: 'What gets recorded',
      recordFull: 'full record',
      recordTicket: '"done"',
      pJobs: 'Only backup job reports',
      pJobsHint: 'No restore test: everything is green and nothing is proven.',
      pList: 'Two slots, as listed',
      pListHint: 'Tests follow the order the systems were entered: critical ones at the end of the list never come up.',
      pCrit: 'Two slots, critical first',
      pCritHint: 'The same number of tests: now the untested ones are the least important.',
      pEasy: 'Quickest first',
      pEasyHint: 'What restores fast goes first: the slow systems are never tested.',
      pAll: 'Three slots: the whole estate',
      pAllHint: 'Twelve tests for twelve systems: each one once a year, as the firm\'s standard asks.',
      pTicket: 'Records say only "done"',
      pTicketHint: 'The same tests, but the ticket has no time and no sign-off.',
      legOk: 'restored within RTO',
      legSlow: 'restored slower than RTO',
      legFail: 'restore fails',
      legNever: 'never tested',
      legDone: 'record without time',
      rejFull: '{q} is full ({s} slots): remove a test or add a slot.',
      rejNone: 'No test slots: add some in the settings.',

      nTests: ['{n} test', '{n} tests'],
      capNone: 'The backup job reports are green all year ({jobs} successful), and not one restore was tried: nothing shows that any system can be brought back.',
      capAll: 'All {n} systems were tested at least once this year, as the firm\'s standard asks ({tests}).',
      capSome: '{tested} of {n} systems tested ({tests}); {never} never, none of them critical.',
      capSomeCrit: '{tested} of {n} systems tested ({tests}); {never} never, {crit} of them critical.',
      nTicket: 'The tickets say only "done": without a time or a sign-off, no record shows that a restore met its RTO.',
      nHidden: '{name}: the backup job report is green all year, and a restore would fail. Nobody knows.',
      nFound: '{name}: the backup job report was green, and the restore failed in the {q} test.',
      nSlow: '{name}: the restore took {t} against an RTO of {rto}. It succeeded, and it is still a finding.',
      nSlowHidden: '{name}: a restore would take {t} against an RTO of {rto}; the system was never tested, so nobody knows.',

      foot: 'Simplified, not legal advice. The firm, its systems and the numbers are made up.',

      explain:
        '<p>A [[backup]] is proven to work not by the report that the job succeeded but by a <b>restore test</b>: ' +
        'the system brought back from the copy onto an isolated host, checked and timed. This made-up firm\'s ' +
        'standard: every system at least once a year.</p>' +
        '<ul>' +
        '<li>There are few slots, so the <b>order</b> decides which systems never come up. Critical first: the ' +
        'untested ones are the least important, and the plan shows it. As listed or quickest first: a critical ' +
        'system can be left out, and quickest first skips exactly the slow ones.</li>' +
        '<li>Every test leaves a <b>record</b>: date, scope, time taken against the <b>recovery time objective</b> ' +
        '(RTO), result and the system owner\'s sign-off. That is the evidence the auditor receives; a ticket that ' +
        'only says "done" does not show the RTO.</li>' +
        '<li>A restore slower than the RTO is a <b>finding</b> even when it succeeds: the business would not be ' +
        'back in time.</li>' +
        '<li>A failed test is not a bad outcome: the control found a copy that is worthless. The repair needs a retest.</li>' +
        '</ul>' +
        '<p>Related: the restore that lies; RPO and RTO; business impact analysis (where the RTOs come from); ' +
        'policy, standard, procedure, record.</p>' +
        '<p>Sources: ISO/IEC 27001:2022, control 8.13 (information backup) and clause 7.5 (documented information); ' +
        'NIS2, Directive (EU) 2022/2555, art. 21(2)(c): backup management and disaster recovery; GDPR, Regulation ' +
        '(EU) 2016/679, art. 32(1)(c) and (d): restoring availability in a timely manner and regularly testing the ' +
        'measures.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
