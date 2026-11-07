/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of cmp-policy-to-record, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the
   page looks them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 /
   other). The title and subtitle come from sim.json (title, concept). Croatian terms: NOTES.md "Term pairs". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Revizijski trag za tri zahtjeva',

      // requirements and their layers
      reqNo: 'Zahtjev {i}',
      reqBackup: 'Sigurnosne kopije',
      reqAccess: 'Prava pristupa',
      reqPatch: 'Ranjivosti i zakrpe',
      lPolicy: 'Politika',
      lStandard: 'Standard',
      lProcedure: 'Procedura',
      lRecords: 'Zapisi, 12 mjeseci',
      lFinding: 'Nalaz',
      backupPolicy: 'Sigurnosne kopije se testiraju.',
      backupStandard: 'Svaki kritični sustav obnavlja se jednom u tromjesečju.',
      backupVague: 'Sigurnosne kopije redovito se testiraju.',
      backupProcedure: 'Obnova na izdvojeni poslužitelj, provjera podataka, izmjereno vrijeme, potpis vlasnika sustava.',
      accessPolicy: 'Pristup se daje prema potrebi posla i provjerava se.',
      accessStandard: 'Vlasnik sustava svaki mjesec pregledava administratorska prava.',
      accessVague: 'Prava se s vremena na vrijeme pregledavaju.',
      accessProcedure: 'Izvoz popisa administratora, vlasnik označi zadržati ili ukloniti, IT uklanja, oboje potpisuju.',
      patchPolicy: 'Poznate ranjivosti otklanjaju se na vrijeme.',
      patchStandard: 'Kritične zakrpe instaliraju se u 14 dana; izvješće svaki mjesec.',
      patchVague: 'Zakrpe se instaliraju bez odgađanja.',
      patchProcedure: 'Popis zakrpa koje nedostaju, instalacija po ozbiljnosti, izvješće o onome što je otvoreno i zašto.',
      noPolicy: 'nema politike',
      noStandard: 'nema standarda',
      noProcedure: 'nema procedure',
      tagOk: '✓ postoji',
      tagMissing: '✗ nedostaje',
      tagVague: '≈ nemjerljivo',
      tagOut: 'izvan traga',
      recCount: '{found} od {expected}',
      recFound: ['{n} zapis', '{n} zapisa', '{n} zapisa'],
      recNoExpect: 'koliko ih treba?',
      fPending: '?',
      fNone: '✓ bez nalaza',
      fDesign: 'nalaz o oblikovanju',
      fOperation: 'nalaz o provedbi',
      rNoPolicy: 'nema politike',
      rNoMandate: 'zapisi bez uporišta',
      rNoStandard: 'nema standarda',
      rVague: 'standard se ne može mjeriti',
      rNoProcedure: 'nema procedure',
      rPaper: 'usklađenost na papiru',
      rGaps: 'praznine u datumima',
      rNone: 'trag je cijeli',
      sumDesign: ['{n} nalaz o oblikovanju', '{n} nalaza o oblikovanju', '{n} nalaza o oblikovanju'],
      sumOperation: ['{n} nalaz o provedbi', '{n} nalaza o provedbi', '{n} nalaza o provedbi'],
      sumNone: ['{n} zahtjev bez nalaza', '{n} zahtjeva bez nalaza', '{n} zahtjeva bez nalaza'],
      sumTitle: 'Izvješće revizije:',
      foot: 'Pojednostavljeno, nije pravni savjet. Tvrtka, njezini zahtjevi i brojke su izmišljeni.',

      // params
      shortBackup: 'Kopije',
      shortAccess: 'Pristup',
      shortPatch: 'Zakrpe',
      pChain: '{name}: lanac',
      pGaps: '{name}: bez zapisa',
      oComplete: 'cijeli lanac',
      oNoPolicy: 'bez politike',
      oVague: 'nejasan standard',
      oNoStandard: 'bez standarda',
      oNoProcedure: 'bez procedure',
      gapsNone: 'nijedno',
      gapsQ: ['zadnje {n} tromj.', 'zadnja {n} tromj.', 'zadnjih {n} tromj.'],
      gapsM: ['zadnji {n} mj.', 'zadnja {n} mj.', 'zadnjih {n} mj.'],

      // presets
      prAuditDay: 'Dan revizije',
      prAuditDayHint: 'Tri zahtjeva, tri različita traga: gdje puca svaki?',
      prWholeTrail: 'Cijeli trag',
      prWholeTrailHint: 'Svaki sloj postoji, zapis za svako razdoblje.',
      prPaper: 'Usklađenost na papiru',
      prPaperHint: 'Isti dokumenti, jednom sa zapisima, dvaput bez njih.',
      prNoMandate: 'Zapisi bez politike',
      prNoMandateHint: 'Dvanaest zapisa ili nijedan: nalaz je isti.',
      prWeak: 'Oslabljen sloj',
      prWeakHint: 'Nejasan standard i procedura koje nema, a posao se radi.',
      prGaps: 'Procedura koju nitko ne slijedi',
      prGapsHint: 'Zapisi prestaju usred godine.',

      // legend
      legRecord: 'zapis',
      legNoRecord: 'nema zapisa',
      legOut: 'izvan traga',
      legHere: 'revizor je ovdje',

      // months, genitive ("iz rujna")
      mg1: 'siječnja', mg2: 'veljače', mg3: 'ožujka', mg4: 'travnja', mg5: 'svibnja', mg6: 'lipnja',
      mg7: 'srpnja', mg8: 'kolovoza', mg9: 'rujna', mg10: 'listopada', mg11: 'studenoga', mg12: 'prosinca',
      dueQ: 'jedan zapis u svakom tromjesečju, 4 u godini',
      dueM: 'jedan zapis svaki mjesec, 12 u godini',
      missingN: ['{n} razdoblje bez zapisa', '{n} razdoblja bez zapisa', '{n} razdoblja bez zapisa'],

      // captions
      cStart: 'Tri zahtjeva male tvrtke, svaki od politike do zapisa za 12 mjeseci razdoblja revizije. Revizor kreće ' +
        'od zahtjeva i ide prema dolje. Pritisni → za prvi korak.',
      cPolicyOk: '{req}: revizor pita koja politika to traži. Politika kaže: „{text}” Trag ide dalje.',
      cPolicyMissing: '{req}: nijedna politika to ne traži. Trag puca na samom vrhu.',
      cPolicyMissingRecords: '{req}: nijedna politika to ne traži, iako se posao radi. Trag puca na vrhu; ono što je ' +
        'ispod nema uporište.',
      cStandardOk: 'Standard to čini mjerljivim: „{text}” Sad se zna što prebrojati: {due}.',
      cStandardVague: 'Standard kaže: „{text}” Koliko često je to? Ne piše, pa se ništa ne može prebrojati. Trag puca ovdje.',
      cStandardMissing: 'Nema standarda: politika kaže što se želi, ali ne koliko često ni tko. Ništa se ne može ' +
        'prebrojati; trag puca ovdje.',
      cStandardOut: 'Ispod prekida: standard postoji, ali ne visi ni o čemu. Revizor ga bilježi izvan traga.',
      cProcedureOk: 'Procedura kaže kako: „{text}” Svaki zapis treba pokazati te korake.',
      cProcedureMissing: 'Nema procedure: nigdje ne piše kako se to radi ni što zapis mora sadržavati, nego se radi ' +
        'onako kako zna jedan čovjek. Trag puca ovdje.',
      cProcedureOut: 'Ispod prekida: procedura postoji, ali ne visi ni o čemu. Revizor je bilježi izvan traga.',
      cRecordsOk: 'Zapisi za cijelo razdoblje: {found} od {expected}, po jedan za svako razdoblje.',
      cRecordsNone: 'Zapisi: {found} od {expected}. Dokumenti su svi tu, a zapisa nema nijednog.',
      cRecordsGaps: 'Zapisi: {found} od {expected}. Posljednji je iz {month}; otad to nitko ne radi.',
      cRecordsOut: 'Zapisi: {found} od {expected}, ali izvan traga: ne vode natrag do zahtjeva.',
      cRecordsOutNoStd: 'Pronađeno: {recs}. Ali prema čemu? Bez mjerljivog standarda nitko ne može reći je li to dovoljno.',
      cRecordsOutNone: 'Zapisa nema, a nigdje ne piše ni koliko bi ih trebalo biti.',
      cFindNone: '{req}: nalaza nema. Trag vodi od zahtjeva do zapisa za svako razdoblje.',
      cFindNoPolicy: '{req}: nalaz o oblikovanju, nema politike. Ništa to ne traži i nijedan zapis ne dokazuje da se radi.',
      cFindNoMandate: '{req}: nalaz o oblikovanju, iako se posao radi. Zapisi bez politike nemaju uporište: ništa ih ne ' +
        'traži, pa mogu prestati kad ode čovjek koji ih radi, a da nitko ne primijeti.',
      cFindNoStandard: '{req}: nalaz o oblikovanju, nema standarda, pa se provedba ne može ispitati.',
      cFindVague: '{req}: nalaz o oblikovanju. {recs} u godini: je li to dovoljno? Nemjerljiv standard to ne kaže, pa ' +
        'se ne može ispitati.',
      cFindNoProcedure: '{req}: nalaz o oblikovanju, nema procedure. Zapisi postoje, ali ovise o jednom čovjeku i ne zna se ' +
        'što moraju pokazati.',
      cFindNoProcedureNone: '{req}: nalaz o oblikovanju, nema procedure, a nema ni zapisa. Kad se procedura napiše, ' +
        'zapisi koji nedostaju ostaju nalaz o provedbi.',
      cFindPaper: '{req}: nalaz o provedbi, usklađenost na papiru. Sve je napisano, a nijedan zapis ne dokazuje da se ' +
        'išta radi.',
      cFindGaps: '{req}: nalaz o provedbi, {missing}. Procedura postoji, ali se više ne slijedi.',
      cReport: 'Izvješće revizije: {d}, {o}, {z}. Ono što nedostaje u oblikovanju dopisuje se; nalaz o provedbi ' +
        'zatvara se tek mjesecima novih zapisa, jer se propušteni mjeseci ne mogu nadoknaditi.',

      explain: '<p>Četiri sloja, svaki odgovara na drugo pitanje. <b>Politika</b> (<i>policy</i>) kaže što se želi ' +
        '(„sigurnosne kopije se testiraju”) i odobrava je uprava. <b>Standard</b> (<i>standard</i>) to čini mjerljivim: ' +
        'što, koliko često i tko („svaki kritični sustav jednom u tromjesečju”). <b>Procedura</b> (<i>procedure</i>) ' +
        'kaže kako se to radi i što zapis mora sadržavati. <b>Zapis</b> (<i>record</i>) dokazuje da se dogodilo.</p>' +
        '<p><b>Revizor</b> (<i>auditor</i>) ide od zahtjeva prema dolje i traži zapise za <b>cijelo razdoblje</b> ' +
        'revizije, ne samo posljednji. Prvi sloj koji nedostaje prekida <b>revizijski trag</b> (<i>audit trail</i>); ' +
        'ono što je ispod prekida može postojati, ali se ne može povezati sa zahtjevom.</p>' +
        '<p>Zato postoje dvije vrste nalaza. <b>Nalaz o oblikovanju</b> (<i>design finding</i>): pravila nema ili se ' +
        'ne mogu ispitati (nema politike, standard kaže „redovito”, nema procedure). Pravilo se može ' +
        'napisati i odobriti za nekoliko dana, ali ako ni zapisa nema, ostaje nalaz o provedbi. <b>Nalaz o provedbi</b> (<i>operating ' +
        'finding</i>): pravila postoje, a zapisa nema. Kad nema nijednog, to je <b>usklađenost na papiru</b> ' +
        '(<i>paper compliance</i>); kad zapisi prestanu, procedura se više ne slijedi i to se vidi kao praznine u ' +
        'datumima. Zapis napravljen danas za prošli mjesec nije dokaz, pa se takav nalaz zatvara tek mjesecima ' +
        'novih zapisa.</p>' +
        '<p>Zapisi bez politike nemaju <b>uporište</b> (<i>mandate</i>): posao se radi jer ga netko radi, i prestat će ' +
        'kad taj netko ode, a da nitko ne primijeti.</p>' +
        '<p>Izvori: ISO/IEC 27001:2022, točke 5.2 (politika), 7.5 (dokumentirane informacije), 9.2 (interni audit) i ' +
        '10.2 (nesukladnost); kontrole iz Dodatka A 5.1, 5.37 (dokumentirane operativne procedure), 8.13 (sigurnosne ' +
        'kopije), 5.18 (prava pristupa) i 8.8 (tehničke ranjivosti). NIS2 (Direktiva (EU) 2022/2555), čl. 21. st. 2. ' +
        'toč. (a) i (f): politike, te politike i postupci za procjenu djelotvornosti mjera. Prava revizija uzima ' +
        'uzorak zapisa i razlikuje teže i lakše nalaze; ovdje se pregledava sve.</p>' +
        '<p>Pojednostavljeno, nije pravni savjet. Tvrtka, njezini zahtjevi, rok od 14 dana i učestalosti su ' +
        'izmišljeni.</p>'
    },
    en: {
      stage: 'Audit trail for three requirements',

      reqNo: 'Requirement {i}',
      reqBackup: 'Backups',
      reqAccess: 'Access rights',
      reqPatch: 'Vulnerabilities and updates',
      lPolicy: 'Policy',
      lStandard: 'Standard',
      lProcedure: 'Procedure',
      lRecords: 'Records, 12 months',
      lFinding: 'Finding',
      backupPolicy: 'Backups are tested.',
      backupStandard: 'Every critical system is restored once a quarter.',
      backupVague: 'Backups are tested regularly.',
      backupProcedure: 'Restore to an isolated host, check the data, record the time taken, the system owner signs.',
      accessPolicy: 'Access is granted by business need and reviewed.',
      accessStandard: 'The system owner reviews admin rights every month.',
      accessVague: 'Rights are reviewed from time to time.',
      accessProcedure: 'Export the admin list, the owner marks keep or remove, IT removes, both sign.',
      patchPolicy: 'Known vulnerabilities are fixed in time.',
      patchStandard: 'Critical updates are installed within 14 days; a report every month.',
      patchVague: 'Updates are installed promptly.',
      patchProcedure: 'List the missing updates, install by severity, report what is still open and why.',
      noPolicy: 'no policy',
      noStandard: 'no standard',
      noProcedure: 'no procedure',
      tagOk: '✓ in place',
      tagMissing: '✗ missing',
      tagVague: '≈ not measurable',
      tagOut: 'outside the trail',
      recCount: '{found} of {expected}',
      recFound: ['{n} record', '{n} records'],
      recNoExpect: 'how many are due?',
      fPending: '?',
      fNone: '✓ no finding',
      fDesign: 'design finding',
      fOperation: 'operating finding',
      rNoPolicy: 'no policy',
      rNoMandate: 'records without a mandate',
      rNoStandard: 'no standard',
      rVague: 'the standard cannot be measured',
      rNoProcedure: 'no procedure',
      rPaper: 'paper compliance',
      rGaps: 'gaps in the dates',
      rNone: 'the trail is whole',
      sumDesign: ['{n} design finding', '{n} design findings'],
      sumOperation: ['{n} operating finding', '{n} operating findings'],
      sumNone: ['{n} requirement without a finding', '{n} requirements without a finding'],
      sumTitle: 'Audit report:',
      foot: 'Simplified, not legal advice. The firm, its requirements and the numbers are made up.',

      shortBackup: 'Backups',
      shortAccess: 'Access',
      shortPatch: 'Updates',
      pChain: '{name}: chain',
      pGaps: '{name}: no records',
      oComplete: 'whole chain',
      oNoPolicy: 'no policy',
      oVague: 'vague standard',
      oNoStandard: 'no standard',
      oNoProcedure: 'no procedure',
      gapsNone: 'none',
      gapsQ: ['last {n} quarter', 'last {n} quarters'],
      gapsM: ['last {n} month', 'last {n} months'],

      prAuditDay: 'Audit day',
      prAuditDayHint: 'Three requirements, three different trails: where does each break?',
      prWholeTrail: 'The whole trail',
      prWholeTrailHint: 'Every layer in place, a record for every period.',
      prPaper: 'Paper compliance',
      prPaperHint: 'The same documents, once with records, twice without.',
      prNoMandate: 'Records without a policy',
      prNoMandateHint: 'Twelve records or none: the same finding.',
      prWeak: 'A weakened layer',
      prWeakHint: 'A vague standard and a missing procedure, while the work gets done.',
      prGaps: 'A procedure nobody follows',
      prGapsHint: 'The records stop in the middle of the year.',

      legRecord: 'record',
      legNoRecord: 'no record',
      legOut: 'outside the trail',
      legHere: 'the auditor is here',

      mg1: 'January', mg2: 'February', mg3: 'March', mg4: 'April', mg5: 'May', mg6: 'June',
      mg7: 'July', mg8: 'August', mg9: 'September', mg10: 'October', mg11: 'November', mg12: 'December',
      dueQ: 'one record in every quarter, 4 in the year',
      dueM: 'one record every month, 12 in the year',
      missingN: ['{n} period without a record', '{n} periods without a record'],

      cStart: 'Three requirements of a small firm, each from the policy down to the records for the 12-month audit ' +
        'period. The auditor starts at the requirement and walks down. Press → for the first step.',
      cPolicyOk: '{req}: the auditor asks which policy requires this. The policy says: “{text}” The trail goes on.',
      cPolicyMissing: '{req}: no policy requires it. The trail breaks at the very top.',
      cPolicyMissingRecords: '{req}: no policy requires it, although the work is being done. The trail breaks at the top; ' +
        'what lies below has no mandate.',
      cStandardOk: 'The standard makes it measurable: “{text}” Now it is clear what to count: {due}.',
      cStandardVague: 'The standard says: “{text}” How often is that? It does not say, so nothing can be counted. The ' +
        'trail breaks here.',
      cStandardMissing: 'No standard: the policy says what is wanted, not how often or by whom. Nothing can be counted; ' +
        'the trail breaks here.',
      cStandardOut: 'Below the break: the standard is there, but it hangs from nothing. The auditor notes it outside the trail.',
      cProcedureOk: 'The procedure says how: “{text}” Every record should show those steps.',
      cProcedureMissing: 'No procedure: nothing says how it is done or what a record must contain; it is done the way ' +
        'one person knows. The trail breaks here.',
      cProcedureOut: 'Below the break: the procedure is there, but it hangs from nothing. The auditor notes it outside the trail.',
      cRecordsOk: 'Records for the whole period: {found} of {expected}, one for every period.',
      cRecordsNone: 'Records: {found} of {expected}. The documents are all there; not one record is.',
      cRecordsGaps: 'Records: {found} of {expected}. The last one is from {month}; nobody has done it since.',
      cRecordsOut: 'Records: {found} of {expected}, but outside the trail: they do not lead back to the requirement.',
      cRecordsOutNoStd: 'Found: {recs}. But against what? Without a measurable standard nobody can say whether that is enough.',
      cRecordsOutNone: 'No records, and nothing says how many there should be.',
      cFindNone: '{req}: no finding. The trail runs from the requirement to a record for every period.',
      cFindNoPolicy: '{req}: design finding, no policy. Nothing requires it, and no record shows it is done.',
      cFindNoMandate: '{req}: design finding, although the work is done. Records without a policy have no mandate: ' +
        'nothing requires them, so they can stop when the person doing them leaves, and nobody would notice.',
      cFindNoStandard: '{req}: design finding, no standard, so the operation cannot be tested.',
      cFindVague: '{req}: design finding. {recs} in a year: is that enough? A vague standard does not say, so it cannot ' +
        'be tested.',
      cFindNoProcedure: '{req}: design finding, no procedure. The records exist, but they depend on one person and ' +
        'nothing says what they must show.',
      cFindNoProcedureNone: '{req}: design finding, no procedure, and no records either. Once the procedure is ' +
        'written, the missing records remain an operating finding.',
      cFindPaper: '{req}: operating finding, paper compliance. Everything is written, and no record shows any of it ' +
        'is done.',
      cFindGaps: '{req}: operating finding, {missing}. The procedure exists, but it is no longer followed.',
      cReport: 'Audit report: {d}, {o}, {z}. What is missing in the design is written; an operating finding closes ' +
        'only after months of new records, since the missed months cannot be made up afterwards.',

      explain: '<p>Four layers, each answering a different question. A <b>policy</b> states what is wanted ' +
        '(“backups are tested”) and is approved by management. A <b>standard</b> makes it measurable: what, how often ' +
        'and by whom (“every critical system once a quarter”). A <b>procedure</b> says how it is done and what a ' +
        'record must contain. A <b>record</b> proves that it happened.</p>' +
        '<p>The <b>auditor</b> walks down from the requirement and asks for records for the <b>whole audit ' +
        'period</b>, not just the latest one. The first missing layer breaks the <b>audit trail</b>; what lies ' +
        'below the break may exist, but it cannot be tied to the requirement.</p>' +
        '<p>That gives two kinds of finding. A <b>design finding</b>: the rules are missing or cannot be tested ' +
        '(no policy, a standard that says “regularly”, no procedure). The rule can be written and approved in days, ' +
        'but if the records are missing too, an operating finding remains. An <b>operating finding</b>: the rules exist, the records do ' +
        'not. With no record at all it is <b>paper compliance</b>; when the records stop, the procedure is no longer ' +
        'followed, and it shows as gaps in the dates. A record made today for a past month is not evidence, so such ' +
        'a finding is closed only by months of new records.</p>' +
        '<p>Records without a policy have no <b>mandate</b>: the work is done because someone does it, and it will ' +
        'stop when that someone leaves, without anyone noticing.</p>' +
        '<p>Sources: ISO/IEC 27001:2022, clauses 5.2 (policy), 7.5 (documented information), 9.2 (internal audit) and ' +
        '10.2 (nonconformity); Annex A controls 5.1, 5.37 (documented operating procedures), 8.13 (information ' +
        'backup), 5.18 (access rights) and 8.8 (technical vulnerabilities). NIS2 (Directive (EU) 2022/2555), ' +
        'art. 21(2)(a) and (f): policies, and policies and procedures to assess the effectiveness of the measures. A ' +
        'real audit samples the records and grades findings as major or minor; here everything is read.</p>' +
        '<p>Simplified, not legal advice. The firm, its requirements, the 14 days and the frequencies are made up.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
