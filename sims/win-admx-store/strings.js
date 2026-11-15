/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of win-admx-store, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural forms
   (hr: 1 / 2–4 / 5+, en: 1 / other). The title and subtitle come from sim.json (title, concept).
   name_<value>_en / name_<value>_hr are what the editor shows from its ADML: data in the editor's language, the same in
   both tables. The Group Policy terms are not in kit/glossary.js yet (NOTES.md, "Term pairs"): {cs} and {ers} are
   filled by the page with the English term in italics, and the explanation writes the pairs out by hand. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Dva administratorska računala, SYSVOL i jedan GPO',
      store: 'Središnje spremište',
      store_none: 'nema',
      store_old: 'stariji skup',
      store_new: 'noviji skup',
      uiLang: 'Jezik uređivača',
      hrAdml: 'hr-HR ADML u spremištu',
      hrAdml_none: 'nema',
      hrAdml_match: 'odgovara',
      hrAdml_old: 'stara kopija',
      hrAdmlOff: 'Samo uz spremište: lokalne mape imaju ADML svojeg sustava.',
      hidden: 'Odabrana postavka',

      'preset_no-store': 'Bez spremišta',
      'hint_no-store': 'Svaki uređivač čita svoju lokalnu mapu',
      'preset_store-new': 'Spremište: noviji skup',
      'hint_store-new': 'Oba uređivača vide sve tri postavke',
      'preset_store-old': 'Spremište: stariji skup',
      'hint_store-old': 'Spremište pobjeđuje i noviju lokalnu mapu ADM-A',
      preset_language: 'Jezik',
      hint_language: 'Uređivač na hr-HR, a u spremištu nema hr-HR ADML-a',
      'preset_stale-lang': 'Stari ADML',
      'hint_stale-lang': 'Mapa hr-HR u spremištu ostala je iz starijeg skupa',

      legendAdmx: 'ADMX (definicija pravila)',
      legendAdml: 'ADML (jezična datoteka)',
      legendStore: 'središnje spremište',
      legendNamed: 'prikazano nazivom',
      legendExtra: 'samo kao Extra Registry Settings',
      legendError: 'greška uređivača',
      legendChanged: 'promijenjeno',

      newer: 'noviji predlošci',
      older: 'stariji predlošci',
      localFolder: 'Lokalna mapa',
      set_new: 'noviji skup',
      set_old: 'stariji skup',
      ignored: 'zanemaruje se',
      editor: 'Uređivač',
      from_store: 'čita središnje spremište',
      from_local: 'čita lokalnu mapu',
      extraRow: 'Extra Registry Settings',
      csTerm: 'Central Store',
      admxLabel: 'ADMX',
      admlLabel: 'ADML',
      errorRow: '{file} se ne učitava',
      fallbackTag: 'zamjena',
      rowLabel: 'Vrijednost {n}: {what}. Klikni za podrijetlo definicije.',

      storeHead: 'Središnje spremište',
      storeNone: 'Nema spremišta: nitko ga nije napravio.',
      storeHrNone: 'nema',
      storeHrOld: 'iz starijeg skupa',
      gpoHead: 'GPO Radne stanice · Registry.pol (Machine, User)',
      clientHead: 'PC07 (klijent)',
      clientLine: ['primjenjuje {n} od {total} vrijednosti, bez ijednog ADMX-a', 'primjenjuje {n} od {total} vrijednosti, bez ijednog ADMX-a', 'primjenjuje {n} od {total} vrijednosti, bez ijednog ADMX-a'],

      cardHint: 'Klikni postavku u uređivaču: odakle dolazi njezina definicija?',
      cardHead: '{admin}, vrijednost {n}',
      cardValue: 'U GPO-u ({pol}):',
      cardAdmx: 'ADMX:',
      cardAdml: 'ADML:',
      cardAdmxMissing: '{file} nije u {where}',
      where_store: 'središnjem spremištu',
      where_local: 'lokalnoj mapi',
      cardFallback: 'nema hr-HR, uzima en-US',
      cardStale: 'iz starijeg skupa: nema tekstova novijeg ADMX-a',
      cardNoAdml: 'nema ni u {lang} ni u en-US',
      cardNotRead: 'ne čita se',
      cardNamed: 'Uređivač je prikazuje nazivom i može je mijenjati.',
      cardExtra: 'Uređivač je ne može prikazati nazivom: vidi je samo u izvještaju kao {ers}. Klijent je svejedno primjenjuje.',
      cardError: 'Uređivač ne može učitati datoteku, pa ni postavku nazivom. Klijent je svejedno primjenjuje.',
      cardLocalIgnored: 'lokalna mapa računala {admin} ima {set}, ali se uz spremište ne čita',

      ord_cmd: 'prvu',
      ord_autoplay: 'drugu',
      ord_laps: 'treću',

      cap_error: '{admin} ne može učitati {file}: hr-HR ADML u spremištu je iz starijeg skupa i nema sve tekstove novijeg ADMX-a („Resource … could not be found”). Postavka se i dalje primjenjuje na klijentima.',
      cap_errorBoth: 'Ni ADM-A ni ADM-B ne mogu učitati {file}: hr-HR ADML u spremištu je iz starijeg skupa i nema sve tekstove novijeg ADMX-a („Resource … could not be found”). Postavka se i dalje primjenjuje na klijentima.',
      cap_disagree: '{admin} nema ADMX za {nth} vrijednost: ona se i dalje primjenjuje na klijentima, ali je vidljiva samo kao „{ers}”.',
      cap_storeOld: '{cs} (središnje spremište) ima stariji skup: i ADM-A čita samo njega, zanemaruje svoje novije lokalne datoteke i {nth} vrijednost vidi samo kao „{ers}”.',
      cap_fallback: 'U spremištu nema hr-HR ADML-a: oba uređivača uzimaju en-US i pokazuju nazive postavki na engleskom.',
      cap_storeSame: 'Postoji {cs} (središnje spremište): oba uređivača koriste predloške iz SYSVOL-a i vide iste postavke.',
      cap_localSame: 'Nema spremišta, a lokalne mape imaju iste predloške: uređivači vide isto.',

      name_cmd_en: 'Prevent access to the command prompt',
      name_cmd_hr: 'Spriječi pristup naredbenom retku',
      name_autoplay_en: 'Turn off Autoplay',
      name_autoplay_hr: 'Isključi automatsku reprodukciju',
      name_laps_en: 'Configure password backup directory',
      name_laps_hr: 'Konfiguriraj direktorij za sigurnosnu kopiju lozinke',

      explain: '<p>Postavke GPO-a ne žive u predlošcima. Uređivač upisuje konfigurirane vrijednosti u <code>Registry.pol</code> ' +
        'unutar GPO-a u SYSVOL-u, a klijenti primjenjuju te vrijednosti; ADMX im ne treba. <em lang="en">Administrative template</em> ' +
        '(administrativni predložak), datoteka ADMX s jezičnom datotekom ADML, samo opisuje postavke uređivaču: naziv, objašnjenje ' +
        'i mjesto u registru.</p>' +
        '<p>Bez <em lang="en">Central Store</em> (središnje spremište) svaki uređivač čita <code>%SystemRoot%\\PolicyDefinitions</code> ' +
        'na svojem računalu. Dva administratora s različitim verzijama sustava zato vide isti GPO različito: vrijednost za koju ' +
        'uređivač nema ADMX i dalje se primjenjuje, ali je vidljiva samo u izvještaju kao <em lang="en">Extra Registry Settings</em> ' +
        'i ne može se urediti nazivom.</p>' +
        '<p>Kad postoji mapa <code>\\\\domena\\SYSVOL\\domena\\Policies\\PolicyDefinitions</code>, svi uređivači GPO-a domene čitaju samo nju i ' +
        'zanemaruju lokalne mape, i kad su one novije. Spremište se ne puni samo: administrator u njega kopira skup predložaka ' +
        '(ADMX i jezične mape poput <code>en-US</code> i <code>hr-HR</code>), a noviji skup može pojedine datoteke preimenovati ili ' +
        'ukloniti. Uz svaki ADMX treba ADML iste verzije u jeziku uređivača; ako ga nema, uređivač uzima <code>en-US</code>, a ako je ' +
        'u mapi jezika uređivača stari ADML, javlja „Resource … could not be found”.</p>' +
        '<p>Stari predlošci <code>.adm</code> kopirali su se u svaki GPO u SYSVOL-u; ADMX se u GPO ne kopiraju, pa ih domenski ' +
        'kontroleri ne repliciraju uz svaki GPO.</p>'
    },

    en: {
      stage: 'Two admin machines, SYSVOL and one GPO',
      store: 'Central Store',
      store_none: 'none',
      store_old: 'older set',
      store_new: 'newer set',
      uiLang: 'Editor language',
      hrAdml: 'hr-HR ADML in the store',
      hrAdml_none: 'none',
      hrAdml_match: 'matching',
      hrAdml_old: 'older copy',
      hrAdmlOff: 'Store only: each local folder has the ADML of its own system.',
      hidden: 'Selected setting',

      'preset_no-store': 'No store',
      'hint_no-store': 'Each editor reads its own local folder',
      'preset_store-new': 'Store: newer set',
      'hint_store-new': 'Both editors see all three settings',
      'preset_store-old': 'Store: older set',
      'hint_store-old': 'The store wins even over ADM-A\'s newer local folder',
      preset_language: 'Language',
      hint_language: 'hr-HR editor, and the store has no hr-HR ADML',
      'preset_stale-lang': 'Stale ADML',
      'hint_stale-lang': 'The store\'s hr-HR folder is left over from the older set',

      legendAdmx: 'ADMX (policy definition)',
      legendAdml: 'ADML (language file)',
      legendStore: 'Central Store',
      legendNamed: 'shown by name',
      legendExtra: 'only as Extra Registry Settings',
      legendError: 'editor error',
      legendChanged: 'changed',

      newer: 'newer templates',
      older: 'older templates',
      localFolder: 'Local folder',
      set_new: 'newer set',
      set_old: 'older set',
      ignored: 'ignored',
      editor: 'Editor',
      from_store: 'reads the Central Store',
      from_local: 'reads its local folder',
      extraRow: 'Extra Registry Settings',
      csTerm: 'Central Store',
      admxLabel: 'ADMX',
      admlLabel: 'ADML',
      errorRow: '{file} fails to load',
      fallbackTag: 'fallback',
      rowLabel: 'Value {n}: {what}. Click for where its definition comes from.',

      storeHead: 'Central Store',
      storeNone: 'No store: nobody has created one.',
      storeHrNone: 'none',
      storeHrOld: 'from the older set',
      gpoHead: 'GPO Workstations · Registry.pol (Machine, User)',
      clientHead: 'PC07 (client)',
      clientLine: ['applies {n} of {total} values, without a single ADMX', 'applies {n} of {total} values, without a single ADMX'],

      cardHint: 'Click a setting in an editor: where does its definition come from?',
      cardHead: '{admin}, value {n}',
      cardValue: 'In the GPO ({pol}):',
      cardAdmx: 'ADMX:',
      cardAdml: 'ADML:',
      cardAdmxMissing: '{file} is not in {where}',
      where_store: 'the Central Store',
      where_local: 'the local folder',
      cardFallback: 'no hr-HR, falls back to en-US',
      cardStale: 'from the older set: lacks strings of the newer ADMX',
      cardNoAdml: 'none in {lang} or en-US',
      cardNotRead: 'not read',
      cardNamed: 'The editor shows it by name and can change it.',
      cardExtra: 'The editor can\'t show it by name: it appears only in the report as {ers}. The client applies it all the same.',
      cardError: 'The editor can\'t load the file, so it can\'t show the setting by name. The client applies it all the same.',
      cardLocalIgnored: '{admin}\'s local folder has the {set}, but with a store it is not read',

      ord_cmd: 'first',
      ord_autoplay: 'second',
      ord_laps: 'third',

      cap_error: '{admin} can\'t load {file}: the store\'s hr-HR ADML is from the older set and lacks strings of the newer ADMX ("Resource … could not be found"). The setting still applies on clients.',
      cap_errorBoth: 'Neither ADM-A nor ADM-B can load {file}: the store\'s hr-HR ADML is from the older set and lacks strings of the newer ADMX ("Resource … could not be found"). The setting still applies on clients.',
      cap_disagree: '{admin} lacks the ADMX for the {nth} value: it still applies on clients, but shows only as "{ers}".',
      cap_storeOld: 'The {cs} holds the older set: ADM-A, too, reads only the store, ignores its newer local files and shows the {nth} value only as "{ers}".',
      cap_fallback: 'The store has no hr-HR ADML: both editors fall back to en-US and show the setting names in English.',
      cap_storeSame: 'A {cs} exists: both editors use the templates in SYSVOL and see the same settings.',
      cap_localSame: 'No store, and the local folders hold the same templates: the editors agree.',

      name_cmd_en: 'Prevent access to the command prompt',
      name_cmd_hr: 'Spriječi pristup naredbenom retku',
      name_autoplay_en: 'Turn off Autoplay',
      name_autoplay_hr: 'Isključi automatsku reprodukciju',
      name_laps_en: 'Configure password backup directory',
      name_laps_hr: 'Konfiguriraj direktorij za sigurnosnu kopiju lozinke',

      explain: '<p>A GPO\'s settings do not live in the templates. The editor writes the configured values to <code>Registry.pol</code> ' +
        'inside the GPO in SYSVOL, and clients apply those values; they need no ADMX. An <em>administrative template</em>, an ADMX ' +
        'file with its ADML language file, only describes the settings to the editor: the name, the explanation and where in the ' +
        'registry the value goes.</p>' +
        '<p>Without a <em>Central Store</em> each editor reads <code>%SystemRoot%\\PolicyDefinitions</code> on its own machine. Two ' +
        'admins on different system versions therefore see the same GPO differently: a value whose ADMX the editor lacks still ' +
        'applies, but shows only in the report as <em>Extra Registry Settings</em> and can\'t be edited by name.</p>' +
        '<p>Once <code>\\\\domain\\SYSVOL\\domain\\Policies\\PolicyDefinitions</code> exists, every editor of a domain GPO reads only that and ignores ' +
        'its local folder, even a newer one. The store does not fill itself: an admin copies a template set into it (the ADMX and ' +
        'language folders such as <code>en-US</code> and <code>hr-HR</code>), and a newer set may rename or remove some files. Each ' +
        'ADMX needs an ADML of the same version in the editor\'s language; without one the editor falls back to <code>en-US</code>, ' +
        'and with an old one it reports "Resource … could not be found".</p>' +
        '<p>The old <code>.adm</code> templates were copied into every GPO in SYSVOL; ADMX are not copied into GPOs, so domain ' +
        'controllers do not replicate them with every GPO.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
