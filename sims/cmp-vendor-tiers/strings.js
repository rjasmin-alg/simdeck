/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of cmp-vendor-tiers, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural
   forms (hr: 1 / 2–4 / 5+, en: 1 / other). The title and subtitle come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Dobavljači po razinama i provjera prema razini',
      hours: '{n} h',
      eur: '{n} €',
      eurK: '{n} tis. €',
      pct: '{n} %',

      s_erp: 'Održavanje ERP-a',
      s_clean: 'Čišćenje',
      s_courier: 'Dostava paketa',
      s_msp: 'Vanjska IT podrška',
      s_office: 'Uredski materijal',
      s_host: 'Hosting web trgovine',
      s_acct: 'Knjigovodstveni servis',
      s_goods: 'Veletrgovac robe',
      s_news: 'Slanje newslettera',
      s_isp: 'Internetska veza',
      s_telco: 'Mobilna telefonija',
      s_pay: 'Obračun plaća',
      s_mail: 'E-pošta u oblaku',
      s_alarm: 'Alarm i zaštitari',
      s_web: 'Web agencija',
      s_callc: 'Pozivni centar',
      s_pack: 'Ambalaža',
      s_recruit: 'Portal za zapošljavanje',
      s_backup: 'Kopije izvan ureda',
      s_insur: 'Osiguranje',
      s_pspay: 'Naplata karticama',
      s_legal: 'Odvjetnički ured',
      s_print: 'Najam pisača',
      s_wms: 'Skladišni sustav',
      s_audit: 'Vanjski revizor',
      s_hw: 'Nabava računala',
      s_train: 'Online obuka',
      s_travel: 'Putna agencija',
      s_coffee: 'Aparati za kavu',
      s_domain: 'Registrar domene',
      subName: 'Noćni administrator',
      sharedName: 'Zajednički pružatelj',

      fPd: 'osobni podaci',
      fAcc: 'pristup produkciji',
      fCrit: 'ključna usluga',
      fHard: 'teško zamjenjiv',

      d_audit: 'ugovor s pravom revizije',
      d_cert: 'dokaz o certifikaciji',
      d_quest: 'kratki upitnik',
      dNone: 'nije provjeren',
      dl_audit: 'R',
      dl_cert: 'C',
      dl_quest: 'U',
      dlNone: '–',

      tier: '{n}. razina',
      r1_reach: 'pristup produkciji, ili ključna usluga koju je teško zamijeniti',
      r2_reach: 'osobni podaci, ili ključna usluga koju je lako zamijeniti',
      r3_reach: 'svi ostali',
      r1_spend: '{n} najvećih po potrošnji',
      r2_spend: 'sljedećih {n} po potrošnji',
      r3_spend: 'ostalih {n}',
      colDepth: '{depth} · {h} h',

      kSame: 'Jedan upitnik svima',
      kTiered: 'Provjera po razinama',
      kByReach: 'razine po dosegu',
      kBySpend: 'razine po potrošnji',
      kHours: '{h} od {b} h',
      kCovered: 'pokriveno {pct} rizika',
      kCov: 'pokriveno',
      kPerHour: '{eur} po satu',
      kShow: 'Prikaži na pozornici: {name}',
      kTotal: 'Rizik ukupno',
      kTotalSub: 'godišnje',
      kTier1: '1. razina nosi {pct} rizika',

      tileAria: '{name}, {tier}: rizik {eur} godišnje; {depth}; pokriveno {cov}.',
      mShared: 'na zajedničkom pružatelju',
      mSub: 'ima podizvođača',

      behind: 'Iza dobavljača',
      behindOff: 'Podizvođači i zajednički pružatelj su skriveni. Uključi „Pokaži što je iza”.',
      subOf: 'podizvođač dobavljača „{parent}”',
      subCovOn: 'pokrivaju ga odredbe o podizvođačima u ugovoru s pravom revizije',
      subCovOff: 'ne pokriva ga ništa: lakša provjera ne gleda podizvođače',
      sharedOf: 'na njemu radi {n} dobavljača (⧉)',
      sharedList: 'na njemu: {list}',
      sharedCov: 'zajednički ispad ne pokriva provjera nijednog dobavljača',
      riskYear: '{eur} godišnje',

      view: 'Na pozornici',
      viewSame: 'jedan upitnik',
      viewTiered: 'po razinama',
      rule: 'Pravilo za razine',
      ruleReach: 'doseg',
      ruleSpend: 'potrošnja',
      ruleHint: 'Doseg i zamjenjivost, ili godišnja potrošnja.',
      budget: 'Sati za procjenu',
      budgetHint: 'Po razinama se troše od 1. razine naniže.',
      reveal: 'Pokaži što je iza',

      pSame: 'Jedan upitnik svima',
      pSameHint: 'Svih 30 dobiva isti upitnik od 2 h: 60 h.',
      pTiered: 'Po razinama, istih 60 h',
      pTieredHint: 'Isti sati, ali najprije najdublja provjera na 1. razini.',
      pEnough: 'Dovoljno sati',
      pEnoughHint: '160 h: svaki dobavljač dobiva provjeru svoje razine.',
      pSpend: 'Razine po potrošnji',
      pSpendHint: 'Iste veličine razina i isti sati, ali razinu određuje koliko plaćamo.',
      pReveal: 'Što je iza',
      pRevealHint: 'Podizvođač vanjske IT podrške i pet dobavljača na istom pružatelju.',

      legPd: 'osobni podaci',
      legAcc: 'pristup produkciji',
      legCrit: 'ključna usluga',
      legHard: 'teško zamjenjiv',
      legCov: 'pokriveni rizik',
      legOpen: 'nepokriveni rizik',
      legNone: 'nije provjeren',

      capSame: 'Jedan upitnik svima: {h}, pokriveno {pct} rizika, {ph} po satu. Po razinama, s istih {b} h: {pct2}, {ph2} po satu.',
      capTiered: 'Po razinama: {h} od {b} h, pokriveno {pct} rizika, {ph} po satu. Jedan upitnik svima: {pct2}, {ph2} po satu.',
      nSubOn: '{sub}, podizvođač dobavljača {parent}, ima administratorski pristup; pokriva ga samo provjera odredbi o podizvođačima u ugovoru s pravom revizije: {cov} od {risk}.',
      nSubOff: '{sub}, podizvođač dobavljača {parent}, ima administratorski pristup, a ovdje ga ne pokriva ništa: {risk} godišnje.',
      nShared: 'Pet dobavljača radi na istom pružatelju: zajednički ispad nosi {risk} godišnje i ne vidi ga provjera nijednog dobavljača.',
      nSpend: 'Po potrošnji {down} (rizik {r1} godišnje) pada u nižu razinu ({d1}), a {up} (rizik {r2}) u višu ({d2}).',
      nOut: ['Sati je ponestalo: {n} dobavljač ostaje neprovjeren, a nosi {pct} rizika.',
        'Sati je ponestalo: {n} dobavljača ostaju neprovjerena, a zajedno nose {pct} rizika.',
        'Sati je ponestalo: neprovjerenih dobavljača ima {n}, a zajedno nose {pct} rizika.'],
      nTopSame: 'Na 1. razini je {n} od {all} dobavljača, a oni nose {pct} rizika; ipak svaki dobiva isti upitnik od {h} kao i aparati za kavu.',
      nTopTiered: 'Na 1. razini je {n} od {all} dobavljača, a oni nose {pct} rizika: tamo ide najdublja provjera.',
      foot: 'Pojednostavljeno, nije pravni savjet. Tvrtka, dobavljači, iznosi i sati su izmišljeni; rizik je očekivani godišnji gubitak kao u registru rizika.',

      explain:
        '<p>Dobavljač nosi rizik onoliko koliko <b>dopire</b> do tvrtke: osobni podaci, pristup produkciji, ' +
        'ključna usluga, i koliko ga je <b>teško zamijeniti</b>. Po tome ga se svrstava u <b>razinu</b> ' +
        '(<i>tier</i>), a razina određuje <b>dubinu provjere</b>:</p>' +
        '<ul>' +
        '<li>3. razina: kratki upitnik (2 h, ovdje pokriva 20 % rizika dobavljača);</li>' +
        '<li>2. razina: dokaz certifikacije, certifikat i njegov opseg (4 h, 50 %);</li>' +
        '<li>1. razina: ugovorne odredbe s <b>pravom revizije</b> (<i>right to audit</i>), obvezama obavještavanja ' +
        'i odredbama o podizvođačima (10 h, 80 %).</li>' +
        '</ul>' +
        '<p>„Pokriveno” znači da provjera daje uvjerenje o tom dijelu rizika i otkriva što treba popraviti; rizik ' +
        'time ne nestaje. Sati za procjenu su ograničeni. Isti upitnik svima rasprši ih na sve: rizik je zgusnut u nekoliko ' +
        'dobavljača, pa provjera po razinama pokrije više rizika <b>po satu</b>. Razine po potrošnji promaše: mali ' +
        'ugovor može nositi administratorski pristup. Jedan upitnik ovdje troši najviše 60 h (30 × 2 h); i dublja ' +
        'provjera za sve (dokaz o certifikaciji, 120 h) pokrila bi manje od provjere po razinama.</p>' +
        '<p>Rizik ne staje kod dobavljača. Njegovi <b>podizvođači</b> (<i>subcontractors</i>) dopiru do istih ' +
        'podataka i sustava, a certifikat dobavljača ih često ne obuhvaća. Kad mnogo usluga radi na istom ' +
        'pružatelju, jedan ispad pogađa sve odjednom: to je <b>koncentracijski rizik</b> (<i>concentration ' +
        'risk</i>), vidljiv tek kad se zabilježi tko na kome radi. Zajednički ispad je zaseban scenarij, uz vlastiti ' +
        'rizik svakog od njih.</p>' +
        '<p>Za izvršitelja obrade osobnih podataka ugovor s pravom revizije i odredbama o drugim izvršiteljima obvezan ' +
        'je bez obzira na razinu (Opća uredba o zaštiti podataka, čl. 28.); razina određuje koliko se dubinski ' +
        'provjerava. NIS2 obvezuje subjekte u svom opsegu; DORA vrijedi za financijski sektor.</p>' +
        '<p>Rizik dobavljača je očekivani godišnji gubitak kao u registru rizika (vjerojatnost × učinak). Udjeli ' +
        'pokrivenosti i sati su izmišljeni. Srodno: registar rizika; podijeljena odgovornost u oblaku.</p>' +
        '<p>Izvori: Direktiva (EU) 2022/2555 (NIS2), čl. 21. st. 2. t. (d) (sigurnost lanca opskrbe) i st. 3.; ' +
        'Uredba (EU) 2016/679 (Opća uredba o zaštiti podataka), čl. 28. (izvršitelj obrade, drugi izvršitelj, ' +
        'revizije); ISO/IEC 27001:2022, kontrole 5.19–5.22 iz Priloga A; Uredba (EU) 2022/2554 (DORA), čl. 28.–30.</p>'
    },
    en: {
      stage: 'Suppliers by tier and the check each tier gets',
      hours: '{n} h',
      eur: '€{n}',
      eurK: '€{n}k',
      pct: '{n}%',

      s_erp: 'ERP maintenance',
      s_clean: 'Cleaning',
      s_courier: 'Parcel delivery',
      s_msp: 'IT support firm',
      s_office: 'Office supplies',
      s_host: 'Web shop hosting',
      s_acct: 'Bookkeeping firm',
      s_goods: 'Goods wholesaler',
      s_news: 'Newsletter sending',
      s_isp: 'Internet connection',
      s_telco: 'Mobile phones',
      s_pay: 'Payroll service',
      s_mail: 'Cloud e-mail',
      s_alarm: 'Alarm and guards',
      s_web: 'Web agency',
      s_callc: 'Call centre',
      s_pack: 'Packaging',
      s_recruit: 'Job portal',
      s_backup: 'Offsite backup',
      s_insur: 'Insurance',
      s_pspay: 'Card payments',
      s_legal: 'Law firm',
      s_print: 'Printer rental',
      s_wms: 'Warehouse system',
      s_audit: 'External auditor',
      s_hw: 'Computer supplier',
      s_train: 'Online training',
      s_travel: 'Travel agency',
      s_coffee: 'Coffee machines',
      s_domain: 'Domain registrar',
      subName: 'Night administrator',
      sharedName: 'Shared provider',

      fPd: 'personal data',
      fAcc: 'production access',
      fCrit: 'critical service',
      fHard: 'hard to replace',

      d_audit: 'a contract with audit rights',
      d_cert: 'certification evidence',
      d_quest: 'a short questionnaire',
      dNone: 'not checked',
      dl_audit: 'A',
      dl_cert: 'C',
      dl_quest: 'Q',
      dlNone: '–',

      tier: 'Tier {n}',
      r1_reach: 'production access, or a critical service that is hard to replace',
      r2_reach: 'personal data, or a critical service that is easy to replace',
      r3_reach: 'all the others',
      r1_spend: 'the {n} largest by spend',
      r2_spend: 'the next {n} by spend',
      r3_spend: 'the other {n}',
      colDepth: '{depth} · {h} h',

      kSame: 'One questionnaire for all',
      kTiered: 'Tiered checking',
      kByReach: 'tiers by reach',
      kBySpend: 'tiers by spend',
      kHours: '{h} of {b} h',
      kCovered: '{pct} of the risk covered',
      kCov: 'covered',
      kPerHour: '{eur} per hour',
      kShow: 'Show on the stage: {name}',
      kTotal: 'Total risk',
      kTotalSub: 'a year',
      kTier1: 'tier 1 carries {pct} of it',

      tileAria: '{name}, {tier}: risk {eur} a year; {depth}; {cov} covered.',
      mShared: 'on the shared provider',
      mSub: 'has a subcontractor',

      behind: 'Behind the suppliers',
      behindOff: 'Subcontractors and the shared provider are hidden. Switch on “Show what is behind”.',
      subOf: 'subcontractor of {parent}',
      subCovOn: 'the subcontractor clauses of the contract with audit rights cover it',
      subCovOff: 'nothing covers it: a lighter check does not look at subcontractors',
      sharedOf: '{n} suppliers run on it (⧉)',
      sharedList: 'on it: {list}',
      sharedCov: 'no check of a single supplier covers a joint outage',
      riskYear: '{eur} a year',

      view: 'On the stage',
      viewSame: 'one questionnaire',
      viewTiered: 'tiered',
      rule: 'Tier rule',
      ruleReach: 'reach',
      ruleSpend: 'spend',
      ruleHint: 'Reach and replaceability, or yearly spend.',
      budget: 'Assessment hours',
      budgetHint: 'Tiered checking spends them from tier 1 down.',
      reveal: 'Show what is behind',

      pSame: 'One questionnaire for all',
      pSameHint: 'All 30 get the same 2-hour questionnaire: 60 h.',
      pTiered: 'Tiered, the same 60 h',
      pTieredHint: 'The same hours, but the deepest check first, on tier 1.',
      pEnough: 'Enough hours',
      pEnoughHint: '160 h: every supplier gets its tier\'s check.',
      pSpend: 'Tiers by spend',
      pSpendHint: 'The same tier sizes and hours, but what we pay decides the tier.',
      pReveal: 'What is behind',
      pRevealHint: 'The IT support firm\'s subcontractor, and five suppliers on one provider.',

      legPd: 'personal data',
      legAcc: 'production access',
      legCrit: 'critical service',
      legHard: 'hard to replace',
      legCov: 'risk covered',
      legOpen: 'risk not covered',
      legNone: 'not checked',

      capSame: 'One questionnaire for all: {h}, {pct} of the risk covered, {ph} per hour. Tiered, with the same {b} h: {pct2}, {ph2} per hour.',
      capTiered: 'Tiered: {h} of {b} h, {pct} of the risk covered, {ph} per hour. One questionnaire for all: {pct2}, {ph2} per hour.',
      nSubOn: '{sub}, a subcontractor of {parent}, has administrator access; only checking the subcontractor clauses of a contract with audit rights covers it: {cov} of {risk}.',
      nSubOff: '{sub}, a subcontractor of {parent}, has administrator access, and here nothing covers it: {risk} a year.',
      nShared: 'Five suppliers run on one provider: a joint outage carries {risk} a year, and no single supplier\'s check sees it.',
      nSpend: 'By spend, {down} (risk {r1} a year) falls to a lower tier ({d1}), while {up} (risk {r2}) rises to a higher one ({d2}).',
      nOut: ['The hours ran out: {n} supplier left unchecked, carrying {pct} of the risk.', 'The hours ran out: {n} suppliers left unchecked, together carrying {pct} of the risk.'],
      nTopSame: 'Tier 1 has {n} of the {all} suppliers and carries {pct} of the risk, yet each gets the same {h} questionnaire as the coffee machines.',
      nTopTiered: 'Tier 1 has {n} of the {all} suppliers and carries {pct} of the risk: the deepest check goes there.',
      foot: 'Simplified, not legal advice. The firm, the suppliers, the amounts and the hours are made up; risk is the expected yearly loss, as in the risk register.',

      explain:
        '<p>A supplier carries as much risk as it <b>reaches</b> into the firm: personal data, production access, a ' +
        'critical service, and as much as it is <b>hard to replace</b>. That puts it in a <b>tier</b>, and the tier ' +
        'sets the <b>depth of checking</b>:</p>' +
        '<ul>' +
        '<li>tier 3: a short questionnaire (2 h, here covering 20% of the supplier\'s risk);</li>' +
        '<li>tier 2: certification evidence, the certificate and its scope (4 h, 50%);</li>' +
        '<li>tier 1: contract clauses with <b>audit rights</b>, duties to notify, and clauses on subcontractors ' +
        '(10 h, 80%).</li>' +
        '</ul>' +
        '<p>"Covered" means the check gives assurance over that share of the risk and shows what to fix; it does not ' +
        'remove the risk. Assessment hours are limited. The same questionnaire for everyone spreads them thin: the risk is ' +
        'concentrated in a few suppliers, so tiered checking covers more risk <b>per hour</b>. Tiers by spend miss: ' +
        'a small contract can carry administrator access. One questionnaire spends at most 60 h here (30 × 2 h); even a ' +
        'deeper check for all (certification evidence, 120 h) would cover less than tiered checking.</p>' +
        '<p>The risk does not stop at the supplier. Its <b>subcontractors</b> reach the same data and systems, and ' +
        'the supplier\'s certificate often does not include them. When many services run on the same provider, one ' +
        'outage hits all of them at once: <b>concentration risk</b>, which shows only once you record who runs on ' +
        'whom. The joint outage is a separate scenario, on top of each one\'s own risk.</p>' +
        '<p>For a processor of personal data, a contract with audit rights and terms on sub-processors is required ' +
        'whatever the tier (GDPR art. 28); the tier sets how deeply you check it. NIS2 binds the entities in its scope; ' +
        'DORA applies to the financial sector.</p>' +
        '<p>A supplier\'s risk is the expected yearly loss, as in the risk register (likelihood × impact). The ' +
        'coverage shares and the hours are made up. Related: the risk register; shared responsibility in the ' +
        'cloud.</p>' +
        '<p>Sources: Directive (EU) 2022/2555 (NIS2), art. 21(2)(d) (supply chain security) and 21(3); Regulation ' +
        '(EU) 2016/679 (GDPR), art. 28 (processors, sub-processors, audits); ISO/IEC 27001:2022, Annex A ' +
        'controls 5.19–5.22; Regulation (EU) 2022/2554 (DORA), art. 28–30.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
