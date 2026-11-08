/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of cmp-dpia-triage, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   The title and subtitle come from sim.json. Numbers are formatted in the page (index.html) and passed in.
   An array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Planirani projekt: aktivnosti, kriteriji provjere s preporukom i matrica rizika za ljude prije i poslije mjera',
      headPlan: 'Što projekt radi',
      a_badge: 'Evidencija ulazaka karticom na vratima',
      a_cars: 'Praćenje lokacije službenih vozila',
      a_camera: 'Kamera nad radnim stolovima',
      a_pcs: 'Nadzor računala zaposlenika',
      a_combine: 'Spajanje zapisa s kadrovskom evidencijom u mjesečno izvješće po osobi',
      a_face: 'Prepoznavanje lica na ulazu',
      as_badge: 'kartice na vratima',
      as_cars: 'lokacija vozila',
      as_camera: 'kamera nad stolovima',
      as_pcs: 'nadzor računala',
      as_combine: 'izvješće po osobi',
      as_face: 'prepoznavanje lica',
      noSourceTag: 'nema što spojiti',
      groupBtn: 'Uvođenje u cijeloj grupi',
      groupSub: '{g} ljudi umjesto {f}',
      headScreen: 'Provjera: kriteriji',
      c_monitor: 'Sustavno praćenje',
      c_sensitive: 'Osjetljivi ili vrlo osobni podaci',
      c_large: 'Velik opseg',
      c_combined: 'Kombiniranje skupova podataka',
      c_vulnerable: 'Ranjivi ispitanici: zaposlenici',
      c_newtech: 'Nova tehnologija',
      cs_monitor: 'praćenje',
      cs_sensitive: 'osjetljivo',
      cs_large: 'opseg',
      cs_combined: 'kombiniranje',
      cs_vulnerable: 'zaposlenici',
      cs_newtech: 'nova tehnologija',
      byGroup: 'grupa',
      litLabel: '{crit}: ispunjen ({by})',
      unlitLabel: '{crit}: nije ispunjen',
      countHead: 'Ispunjeno kriterija',
      countMark: 'od 2: obično procjena',
      headVerdict: 'Preporuka',
      v_empty: 'Nema što provjeriti',
      v_record: 'Procjena obično nije potrebna',
      v_consult: 'Procjena prije početka; rizik ostaje visok',
      v_proceed: 'Procjena prije početka; rizik nije visok',
      vd_empty: 'Uključi što projekt radi.',
      vd_record: 'Zabilježi provjeru i razlog.',
      vd_consult: 'Smanji rizik, promijeni rješenje ili se prije početka savjetuj s nadzornim tijelom.',
      vd_proceed: 'Projekt može krenuti; procjenu čuvaj i preispitaj kad se obrada promijeni.',
      headRisk: 'Rizik za ljude: prije i poslije mjera',
      highLine: 'visok: iznad 12',
      axisL: 'vjerojatnost',
      axisS: 'ozbiljnost',
      markIn: '{act}: prije mjera {l} × {s} = {v}',
      markRes: '{act}: poslije mjera {l} × {s} = {v}',
      markSame: '{act}: {l} × {s} = {v}, bez pomaka zbog mjera',
      headMeasures: 'Mjere iz procjene',
      m_minimise: 'Smanjenje količine podataka',
      m_pseudo: 'Pseudonimizacija',
      m_retention: 'Kraće čuvanje',
      m_access: 'Uži pristup',
      mh_minimise: 'samo potrebno: bez lokacije izvan radnog vremena, bez sadržaja',
      mh_pseudo: 'šifra umjesto imena; ime samo uz zabilježen razlog',
      mh_retention: '30 dana umjesto godine dana',
      mh_access: 'samo službenik za sigurnost, ne svaki rukovoditelj',
      topLine: 'Najviši poslije mjera: {after} ({act}); prije: {before} ({act0})',
      topNone: 'Na matrici nema aktivnosti.',
      foot: 'Pojednostavljeno, nije pravni savjet. Tvrtka, aktivnosti i razine su izmišljene, ali uvjerljive.',
      and: 'i',
      legIn: 'prije mjera',
      legRes: 'poslije mjera',
      legArrow: 'pomak zbog mjera',
      legHigh: 'visok rizik',
      legLit: 'kriterij ispunjen',
      pBadge: 'Samo kartice na vratima',
      pBadgeHint: 'Jedan kriterij: procjena obično nije potrebna',
      pCamera: 'Kamera nad stolovima',
      pCameraHint: 'Dva kriterija i visok rizik',
      pCameraMeasures: 'Kamera s mjerama',
      pCameraMeasuresHint: 'Isti kriteriji, rizik 16 → 6',
      pJoin: 'Kartice i izvješće po osobi',
      pJoinHint: 'Bezazlen zapis spojen s kadrovskom evidencijom: dva kriterija',
      pPackage: 'Paket nadzora radnog mjesta',
      pPackageHint: 'Četiri kriterija, dva visoka rizika',
      pFaceGroup: 'Prepoznavanje lica u grupi',
      pFaceGroupHint: 'Sve mjere, a rizik ostaje visok',
      nMet: ['Ispunjen je {c} kriterij', 'Ispunjena su {c} kriterija', 'Ispunjeno je {c} kriterija'],
      capEmpty: 'Projekt još ništa ne radi: uključi aktivnosti u planu i gledaj kako se pale kriteriji.',
      capRecord: 'Ispunjen je jedan kriterij ({crit}): procjena učinka obično nije potrebna, ali provjeru i razlog treba zabilježiti.',
      capConsult0: '{n}: procjena učinka prije početka. Najviši rizik, {score} ({act}), iznad je crte: smanji ga mjerama ili drugim rješenjem, ili se prije početka savjetuj s nadzornim tijelom.',
      capConsult: '{n}: procjena učinka prije početka. I poslije mjera najviši je rizik {score} ({act}), iznad crte: smanji ga dalje, promijeni rješenje ili se prije početka savjetuj s nadzornim tijelom.',
      capProceed0: '{n}: procjena učinka prije početka. Nijedan rizik nije iznad crte (najviši {score}, {act}): projekt može krenuti uz procjenu.',
      capProceed: '{n}: procjena učinka prije početka. Poslije mjera najviši je rizik {score} ({act}), nije iznad crte: projekt može krenuti uz procjenu.',
      nNoSource: 'Izvješće nema što spojiti: prvo uključi neki zapis.',
      nIdle: ['{list} ovdje ništa ne smanjuje: mjera mora odgovarati riziku.', '{list} ovdje ništa ne smanjuju: mjera mora odgovarati riziku.', '{list} ovdje ništa ne smanjuju: mjera mora odgovarati riziku.'],
      nSame: 'Mjere su smanjile rizik, ne provjeru: broj kriterija i dalje je {c}.',
      explain: '<p>Kad je vjerojatno da će neka obrada, osobito uz nove tehnologije, prouzročiti <b>visok rizik</b> za ' +
        'prava i slobode ljudi, <b>voditelj obrade</b> (<i lang="en">controller</i>) prije početka obrade provodi ' +
        '<b>procjenu učinka na zaštitu podataka</b> (<i lang="en">data protection impact assessment</i>) (Opća uredba o ' +
        'zaštiti podataka, članak 35. stavak 1.).</p>' +
        '<p>Je li rizik vjerojatno visok, provjerava se kriterijima iz smjernica koje je preuzeo Europski odbor za ' +
        'zaštitu podataka (WP248): vrednovanje ili bodovanje, automatizirane odluke s pravnim učinkom, <b>sustavno ' +
        'praćenje</b> (<i lang="en">systematic monitoring</i>), <b>osjetljivi ili vrlo osobni podaci</b> (<i lang="en">' +
        'sensitive or highly personal data</i>), <b>velik opseg</b> (<i lang="en">large scale</i>), <b>kombiniranje ' +
        'skupova podataka</b> (<i lang="en">combining datasets</i>), <b>ranjivi ispitanici</b> (<i lang="en">vulnerable ' +
        'data subjects</i>), <b>nova tehnologija</b> (<i lang="en">new technology</i>) i obrada koja ljudima ' +
        'onemogućuje ostvarivanje prava ili korištenje usluge. Stranica prikazuje šest od njih. U većini slučajeva dva ' +
        'ispunjena kriterija znače procjenu; što ih je više, to je procjena izvjesnija, a ponekad je dovoljan i jedan. ' +
        'Tko odluči da procjena nije potrebna, zapisuje zašto. Zaposlenici su ranjivi jer je poslodavac u jačem ' +
        'položaju. Nadzorno tijelo, u Hrvatskoj Agencija za zaštitu osobnih podataka (AZOP), objavljuje i popis obrada za koje je procjena uvijek potrebna (članak 35. stavak ' +
        '4.).</p>' +
        '<p>Procjena boduje rizik za ljude kao <b>vjerojatnost</b> (<i lang="en">likelihood</i>) × <b>ozbiljnost</b> ' +
        '(<i lang="en">severity</i>) (uvodna izjava 76), na istoj matrici kao registar rizika, i bira mjere: ' +
        '<b>smanjenje količine podataka</b> (<i lang="en">data minimisation</i>, članak 5. stavak 1. točka (c)), ' +
        '<b>pseudonimizaciju</b> (<i lang="en">pseudonymisation</i>, članak 4. točka 5.), <b>kraće čuvanje</b> ' +
        '(<i lang="en">shorter retention</i>; ograničenje pohrane, članak 5. stavak 1. točka (e)) i <b>uži pristup</b> ' +
        '(<i lang="en">narrower access</i>). Mjera pomaže samo ako odgovara riziku: šifra umjesto imena ništa ne mijenja ' +
        'na slici kamere.</p>' +
        '<p>Mjere spuštaju <b>preostali rizik</b> (<i lang="en">residual risk</i>), ali ne mijenjaju provjeru: ona se ' +
        'radi za plan, prije mjera. Ako rizik i poslije mjera ostane visok, voditelj obrade prije početka obrade traži ' +
        '<b>prethodno savjetovanje</b> (<i lang="en">prior consultation</i>) s <b>nadzornim tijelom</b> (<i lang="en">' +
        'supervisory authority</i>) (članak 36. stavak 1.) ili mijenja rješenje. Procjena se preispituje kad se obrada ' +
        'promijeni (članak 35. stavak 11.).</p>' +
        '<p>Razine i učinci mjera su izmišljeni. Uredba ne određuje broj ljudi za velik opseg; ovdje je to cijela ' +
        'grupa od 2.400 ljudi, a tvrtka ima 140.</p>' +
        '<p>U Hrvatskoj Zakon o provedbi Opće uredbe o zaštiti podataka (NN 42/2018) dodaje nacionalna pravila, na ' +
        'primjer o videonadzoru. Praćenje zaposlenika prema Zakonu o radu uključuje i radničko vijeće.</p>'
    },
    en: {
      stage: 'A planned project: its activities, the screening criteria with the recommendation, and the matrix of risk to people before and after measures',
      headPlan: 'What the project does',
      a_badge: 'Badge access logs at the doors',
      a_cars: 'Location tracking of company cars',
      a_camera: 'A camera over the desks',
      a_pcs: 'Monitoring staff computers',
      a_combine: 'Joining the logs with HR records into a monthly report per person',
      a_face: 'Face recognition at the entrance',
      as_badge: 'badge logs',
      as_cars: 'car tracking',
      as_camera: 'desk camera',
      as_pcs: 'computer monitoring',
      as_combine: 'report per person',
      as_face: 'face recognition',
      noSourceTag: 'nothing to join',
      groupBtn: 'Roll out across the whole group',
      groupSub: '{g} people instead of {f}',
      headScreen: 'Screening: the criteria',
      c_monitor: 'Systematic monitoring',
      c_sensitive: 'Sensitive or highly personal data',
      c_large: 'Large scale',
      c_combined: 'Combining datasets',
      c_vulnerable: 'Vulnerable people: employees',
      c_newtech: 'New technology',
      cs_monitor: 'monitoring',
      cs_sensitive: 'sensitive',
      cs_large: 'scale',
      cs_combined: 'combining',
      cs_vulnerable: 'employees',
      cs_newtech: 'new tech',
      byGroup: 'group',
      litLabel: '{crit}: met ({by})',
      unlitLabel: '{crit}: not met',
      countHead: 'Criteria met',
      countMark: 'from 2: usually an assessment',
      headVerdict: 'Recommendation',
      v_empty: 'Nothing to screen',
      v_record: 'Assessment not usually needed',
      v_consult: 'Assess before starting; the risk stays high',
      v_proceed: 'Assess before starting; the risk is not high',
      vd_empty: 'Switch on what the project does.',
      vd_record: 'Record the screening and the reason.',
      vd_consult: 'Lower the risk, change the design, or consult the supervisory authority before starting.',
      vd_proceed: 'The project can start; keep the assessment and review it when the processing changes.',
      headRisk: 'Risk to people: before and after measures',
      highLine: 'high: above 12',
      axisL: 'likelihood',
      axisS: 'severity',
      markIn: '{act}: before measures {l} × {s} = {v}',
      markRes: '{act}: after measures {l} × {s} = {v}',
      markSame: '{act}: {l} × {s} = {v}, not moved by the measures',
      headMeasures: 'Measures from the assessment',
      m_minimise: 'Data minimisation',
      m_pseudo: 'Pseudonymisation',
      m_retention: 'Shorter retention',
      m_access: 'Narrower access',
      mh_minimise: 'only what is needed: no location after hours, no content',
      mh_pseudo: 'a code instead of the name; the name only on a recorded need',
      mh_retention: '30 days instead of a year',
      mh_access: 'the security officer only, not every line manager',
      topLine: 'Highest after measures: {after} ({act}); before: {before} ({act0})',
      topNone: 'No activity on the matrix.',
      foot: 'Simplified, not legal advice. The firm, the activities and the levels are made up, but plausible.',
      and: 'and',
      legIn: 'before measures',
      legRes: 'after measures',
      legArrow: 'moved by the measures',
      legHigh: 'high risk',
      legLit: 'criterion met',
      pBadge: 'Badge logs only',
      pBadgeHint: 'One criterion: an assessment is not usually needed',
      pCamera: 'Camera over the desks',
      pCameraHint: 'Two criteria and a high risk',
      pCameraMeasures: 'Camera with measures',
      pCameraMeasuresHint: 'The same criteria, risk 16 → 6',
      pJoin: 'Badges and a report per person',
      pJoinHint: 'A harmless log joined with HR records: two criteria',
      pPackage: 'Workplace monitoring package',
      pPackageHint: 'Four criteria, two high risks',
      pFaceGroup: 'Face recognition across the group',
      pFaceGroupHint: 'Every measure, and the risk stays high',
      nMet: ['{c} criterion is met', '{c} criteria are met'],
      capEmpty: 'The project does nothing yet: switch on activities in the plan and watch the criteria light up.',
      capRecord: 'One criterion is met ({crit}): an impact assessment is not usually needed, but record the screening and the reason.',
      capConsult0: '{n}: assess before the project starts. The highest risk, {score} ({act}), is above the line: lower it with measures or a different design, or consult the supervisory authority before starting.',
      capConsult: '{n}: assess before the project starts. Even after the measures the highest risk is {score} ({act}), above the line: lower it further, change the design, or consult the supervisory authority before starting.',
      capProceed0: '{n}: assess before the project starts. No risk is above the line (highest {score}, {act}): the project can start with the assessment on file.',
      capProceed: '{n}: assess before the project starts. After the measures the highest risk is {score} ({act}), not above the line: the project can start with the assessment on file.',
      nNoSource: 'The report has nothing to join: switch on a log first.',
      nIdle: ['{list} lowers nothing here: a measure has to fit the risk.', '{list} lower nothing here: a measure has to fit the risk.'],
      nSame: 'The measures lowered the risk, not the screening: the count is still {c}.',
      explain: '<p>When processing, in particular using new technologies, is likely to result in a <b>high risk</b> to ' +
        'people\'s rights and freedoms, the <b>controller</b> carries out a <b>data protection impact assessment</b> ' +
        'before the processing starts (GDPR art. 35(1)).</p>' +
        '<p>Whether the risk is likely high is screened with the criteria of the guidelines the European Data ' +
        'Protection Board endorsed (WP248): evaluation or scoring, automated decisions with legal effect, ' +
        '<b>systematic monitoring</b>, <b>sensitive or highly personal data</b>, <b>large scale</b>, <b>combining ' +
        'datasets</b>, <b>vulnerable data subjects</b>, <b>new technology</b>, and processing that stops people from ' +
        'exercising a right or using a service. The page shows six of them. In most cases two criteria met mean an ' +
        'assessment; the more are met, the more likely it is needed, and sometimes one is enough. A controller that ' +
        'decides against an assessment records why. Employees are vulnerable because the employer holds the stronger ' +
        'position. The supervisory authority, in Croatia the Agencija za zaštitu osobnih podataka (AZOP), also ' +
        'publishes a list of processing that always needs an assessment ' +
        '(art. 35(4)).</p>' +
        '<p>The assessment scores the risk to people as <b>likelihood</b> × <b>severity</b> (recital 76), on the same ' +
        'matrix as the risk register, and chooses measures: <b>data minimisation</b> (art. 5(1)(c)), ' +
        '<b>pseudonymisation</b> (art. 4(5)), <b>shorter retention</b> (storage limitation, art. 5(1)(e)) and ' +
        '<b>narrower access</b>. A measure helps only if it fits the risk: a code instead of the name changes nothing ' +
        'in a camera picture.</p>' +
        '<p>Measures lower the <b>residual risk</b>, but they do not change the screening: that is done on the plan, ' +
        'before measures. If the risk stays high after the measures, the controller asks the <b>supervisory ' +
        'authority</b> for <b>prior consultation</b> before the processing starts (art. 36(1)), or changes the design. ' +
        'The assessment is reviewed when the processing changes (art. 35(11)).</p>' +
        '<p>The levels and the effects of the measures are made up. The regulation sets no number of people for large ' +
        'scale; here it is the whole group of 2,400 people, against the firm\'s 140.</p>' +
        '<p>In Croatia the Zakon o provedbi Opće uredbe o zaštiti podataka (the GDPR Implementation Act, NN 42/2018) ' +
        'adds national rules, for example on video surveillance. Monitoring employees also involves the workers\' ' +
        'council under the Zakon o radu (Labour Act).</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
