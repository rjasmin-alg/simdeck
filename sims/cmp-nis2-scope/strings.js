/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of cmp-nis2-scope, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   The title and subtitle come from sim.json. Numbers are formatted in the page (index.html) and passed in.
   Caption keys: SPEC.md rule 9. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Organizacija: sektor, veličina i posebne uloge; tablica opsega NIS2 s razredom koji iz nje slijedi; što taj razred znači za nadzor i kazne',
      headOrg: 'Organizacija',
      headScope: 'Je li obveznik? Tablica opsega',
      headFollows: 'Što iz toga slijedi',
      foot: 'Pojednostavljeno, nije pravni savjet. Organizacije i njihove brojke su izmišljene; granice i kazne su iz teksta direktive. Konačnu riječ imaju nacionalni zakon i popisi nadležnih tijela.',

      pSector: 'Sektor',
      pStaff: 'Zaposleni',
      pTurnover: 'Godišnji promet',
      pBalance: 'Ukupna godišnja bilanca',

      s_energy: 'Energetika (struja, plin, toplina)',
      s_transport: 'Promet',
      s_health: 'Zdravstvo (bolnica)',
      s_water: 'Opskrba pitkom vodom',
      s_cloud: 'Računalstvo u oblaku ili podatkovni centar',
      s_msp: 'Upravljane IT ili sigurnosne usluge',
      s_postal: 'Poštanske i kurirske usluge',
      s_waste: 'Gospodarenje otpadom',
      s_food: 'Proizvodnja i distribucija hrane',
      s_manufacturing: 'Proizvodnja strojeva, elektronike, vozila',
      s_chemicals: 'Kemikalije',
      s_digital: 'Internetska tržnica, tražilica ili društvena mreža',
      s_research: 'Istraživačka organizacija',
      s_central: 'Tijelo središnje državne uprave',
      s_local: 'Jedinica lokalne samouprave',
      s_retail: 'Trgovina na malo i web-trgovina',
      s_software: 'Razvoj softvera po narudžbi',
      s_tourism: 'Hotel i turizam',

      g_annex1: 'Prilog I: sektor visoke kritičnosti',
      g_annex2: 'Prilog II: jedan od ostalih kritičnih sektora',
      g_central: 'Javna uprava, središnja država',
      g_local: 'Javna uprava, lokalna razina',
      g_unlisted: 'Nije na popisima direktive',
      gs_annex1: 'Prilog I',
      gs_annex2: 'Prilog II',
      gs_central: 'javna uprava',
      gs_local: 'javna uprava',
      gs_unlisted: 'nije na popisu',

      rStaff: 'Zaposleni (godišnje jedinice rada)',
      rTurnover: 'Godišnji promet',
      rBalance: 'Ukupna godišnja bilanca',
      eurM: '{v} mil. €',
      z_micro: 'Mikro',
      z_small: 'Malo',
      z_medium: 'Srednje',
      z_large: 'Veliko',
      zs_micro: 'Mikro',
      zs_small: 'Malo',
      zs_medium: 'Sred.',
      zs_large: 'Vel.',
      zw_micro: 'Mikro poduzeće',
      zw_small: 'Malo poduzeće',
      zw_medium: 'Srednje poduzeće',
      zw_large: 'Veliko poduzeće',
      headSize: 'Veličina',
      ceil0: 'Granica mikro poduzeća:',
      ceil1: 'Granica malog poduzeća:',
      ceil2: 'Granica srednjeg poduzeća:',
      ceilOver: 'Iznad granice srednjeg poduzeća:',
      ceilStaff: 'manje od {n} zaposlenih',
      ceilTurnover: 'promet ≤ {v}',
      ceilBalance: 'bilanca ≤ {v}',
      and: 'i',
      or: 'ili',
      yes: 'da',
      no: 'ne',

      colRow: 'Što je organizacija',
      groupSector: 'Sektor',
      groupRoles: 'Posebne uloge (uključi ili isključi)',
      r_annex1: 'Prilog I: visoka kritičnost',
      r_annex2: 'Prilog II: ostali kritični',
      r_central: 'Središnja državna uprava',
      r_local: 'Lokalna samouprava',
      r_unlisted: 'Sektor nije na popisu',
      r_telecom: 'Javne elektroničke komunikacije',
      r_dns: 'DNS ili registar vršne domene',
      r_qtsp: 'Kvalificirane usluge povjerenja',
      r_named: 'Odredila ga država',
      c_out: '–',
      c_important: 'V',
      c_essential: 'K',
      cl_out: 'Izvan opsega',
      cl_important: 'Važni subjekt',
      cl_essential: 'Ključni subjekt',
      cellLabel: '{row}, {size}: {cls}',
      rowOn: 'vrijedi',
      decidedBy: 'Odlučuje redak „{row}”, stupac „{size}”.',
      outBy_small: 'Sektor je na popisu, ali organizacija je ispod granice veličine.',
      outBy_unlisted: 'Sektor nije na popisima direktive; veličina tu ništa ne mijenja.',
      outBy_local: 'Lokalna razina ulazi samo ako je doda nacionalni zakon.',

      youHere: '▼ ova organizacija',
      fSup: 'Nadzor',
      supE: 'Unaprijed i naknadno: inspekcije, redovite i ciljane revizije, sigurnosna skeniranja, i bez povoda',
      supI: 'Naknadno: kad postoje dokazi, naznake ili informacije o nesukladnosti',
      fObl: 'Obveze',
      oblBoth: 'Iste za oba razreda: mjere upravljanja rizikom, prijava značajnog incidenta u 24 h, 72 h i mjesec dana, uprava odobrava mjere i odgovara za njih',
      fFine: 'Najviša kazna barem',
      fineE: '10 mil. € ili 2 % svjetskog prometa, što je više',
      fineI: '7 mil. € ili 1,4 % svjetskog prometa, što je više',
      fFineOrg: 'Uz promet od {t}',
      byFixed: 'odlučuje fiksni iznos',
      byPct: 'odlučuje {p} prometa',
      pctE: '2 %',
      pctI: '1,4 %',
      publicFine: 'Za tijela javne uprave nacionalni zakon određuje izriču li se kazne.',
      fMgr: 'Uprava',
      mgrE: 'Moguća privremena zabrana obavljanja upravljačke funkcije',
      mgrI: 'Ta mjera ne postoji',
      mgrPublic: 'Za tijela javne uprave privremena zabrana ne primjenjuje se.',
      outBox: 'NIS2 se na ovu organizaciju ne primjenjuje: nema ni nadzora ni kazni iz tablice. Druge obveze ostaju (GDPR, ugovori), a nacionalni zakon ili popis države mogu je ipak uvrstiti.',

      cap_annex1_essential: 'Veliko poduzeće u sektoru visoke kritičnosti: {cls}.',
      cap_annex1_important: 'Srednje poduzeće u sektoru visoke kritičnosti: {cls}.',
      cap_annex2_important: '{size} u sektoru iz Priloga II (ostali kritični sektori): {cls}.',
      cap_central_essential: 'Tijelo središnje državne uprave, bez obzira na veličinu: {cls}.',
      cap_telecom_essential: 'Pružatelj javnih elektroničkih komunikacija, srednji ili veći: {cls}.',
      cap_telecom_important: 'Mali pružatelj javnih elektroničkih komunikacija: {cls}.',
      cap_dns_essential: 'Pružatelj usluga DNS-a ili registar vršne domene, bez obzira na veličinu: {cls}.',
      cap_qtsp_essential: 'Kvalificirani pružatelj usluga povjerenja, bez obzira na veličinu: {cls}.',
      cap_named_essential: 'Država ju je odredila, bez obzira na veličinu: {cls}.',
      capOut_small: '{size} u sektoru s popisa, ispod granice veličine: {cls}.',
      capOut_unlisted: 'Sektor nije na popisima direktive: {cls}, ma koliko velika bila organizacija.',
      capOut_local: 'Lokalna samouprava: {cls}, osim ako je nacionalni zakon uključi.',
      nUp2: 'S 50 ili više zaposlenih, ili s prometom i bilancom iznad 10 mil. €, postala bi {cls}.',
      nUp3: 'S 250 ili više zaposlenih, ili s prometom iznad 50 mil. € i bilancom iznad 43 mil. €, postala bi {cls}.',
      nDown1: 'S manje od 50 zaposlenih i prometom ili bilancom do 10 mil. € bila bi {cls}.',
      nDown2: 'S manje od 250 zaposlenih i prometom do 50 mil. € ili bilancom do 43 mil. € bila bi {cls}.',
      nCap: 'U sektoru iz Priloga II nijedna veličina ne daje ključni subjekt; to može samo posebna uloga ili odluka države.',
      nAny: 'Veličina tu ništa ne mijenja.',
      nNever: 'Nijedna veličina to ne mijenja; uvrstiti je može samo posebna uloga ili nacionalni zakon.',
      nNamedIdle: 'Država može odrediti samo subjekte vrste s popisa direktive, pa ta oznaka ovdje ne djeluje.',
      nSeveral: 'Vrijedi više redaka; računa se najstroži.',

      legE: 'K: ključni subjekt',
      legI: 'V: važni subjekt',
      legOut: '–: izvan opsega',
      legDecide: 'odlučujuća ćelija',
      legCol: 'stupac njezine veličine',

      pWater: 'Regionalni vodovod',
      pWaterHint: 'Sektor visoke kritičnosti, 180 zaposlenih. Što se mijenja na 250?',
      pMsp: 'Upravljane IT usluge',
      pMspHint: 'Promet 62 mil. €, bilanca 38 mil. €: srednje ili veliko?',
      pMachines: 'Proizvođač strojeva',
      pMachinesHint: 'Veliko poduzeće u sektoru iz Priloga II; usporedi s energetikom.',
      pShop: 'Trgovački lanac',
      pShopHint: '1 000 zaposlenih i 200 mil. € prometa, a sektor nije na popisu.',
      pDns: 'Mala tvrtka koja vodi DNS',
      pDnsHint: 'Devet ljudi razvija softver i vodi DNS za klijente.',
      pAgency: 'Državna agencija',
      pAgencyHint: '49 zaposlenih u središnjoj državnoj upravi; usporedi s vodovodom iste veličine.',

      explain:
        '<p><b>Tko je obveznik.</b> Direktiva NIS2 (Direktiva (EU) 2022/2555, čl. 2. st. 1.) obuhvaća subjekte vrste ' +
        'navedene u Prilogu I (<b>sektori visoke kritičnosti</b>, <i>sectors of high criticality</i>: energetika, promet, ' +
        'bankarstvo, zdravstvo, voda, digitalna infrastruktura, upravljanje uslugama IKT-a, javna uprava, svemir) ili u ' +
        'Prilogu II (<b>ostali kritični sektori</b>, <i>other critical sectors</i>: pošta, otpad, kemikalije, hrana, ' +
        'proizvodnja, digitalni pružatelji, istraživanje) koji su barem <b>srednja poduzeća</b> (<i>medium-sized ' +
        'enterprises</i>) prema Preporuci 2003/361/EZ: srednje poduzeće ima manje od 250 zaposlenih i godišnji promet do ' +
        '50 mil. € <i>ili</i> ukupnu godišnju bilancu do 43 mil. €; malo manje od 50 i do 10 mil. €; mikro manje od 10 i ' +
        'do 2 mil. €. Broj zaposlenih je uvjet, a od dvije novčane brojke dovoljna je jedna.</p>' +
        '<p><b>Ključni i važni subjekti</b> (<i>essential and important entities</i>, čl. 3.). Ključni su velika poduzeća ' +
        'iz Priloga I, kvalificirani pružatelji usluga povjerenja, registri naziva vršnih domena i pružatelji usluga DNS-a ' +
        'bez obzira na veličinu, pružatelji javnih elektroničkih komunikacijskih mreža ili usluga od srednje veličine, ' +
        'subjekti javne uprave središnje države te subjekti koje država odredi (jedini pružatelj bitne usluge, kritični ' +
        'subjekti; čl. 2. st. 2. t. (b)–(e) i st. 3.). Svi ostali obveznici su važni (čl. 3. st. 2.).</p>' +
        '<p><b>Što razred mijenja.</b> Obveze su iste: uprava odobrava mjere upravljanja kibernetičkim rizikom i odgovara ' +
        'za njih (čl. 20.), mjere (čl. 21.), prijava značajnog incidenta u 24 sata, 72 sata i mjesec dana (čl. 23.). ' +
        'Razlikuje se nadzor: ključne subjekte nadzorno tijelo provjerava unaprijed i naknadno (<i>ex ante</i> i <i>ex ' +
        'post</i>: inspekcije, nasumične provjere, redovite i ciljane revizije, sigurnosna skeniranja; čl. 32.), važne ' +
        'tek naknadno, kad dobije dokaze ili naznake (čl. 33.). Privremena zabrana obavljanja upravljačke funkcije postoji ' +
        'samo za ključne (čl. 32. st. 5.). Najviša kazna mora biti barem 10 mil. € ili 2 % ukupnog svjetskog godišnjeg ' +
        'prometa poduzetnika, što je više, za ključne, i 7 mil. € ili 1,4 % za važne (čl. 34. st. 4. i 5.): do 500 mil. € ' +
        'prometa odlučuje fiksni iznos, iznad toga postotak. Za javnu upravu država određuje izriču li se kazne (čl. 34. ' +
        'st. 7.).</p>' +
        '<p><b>Konačnu riječ ima država.</b> Država sastavlja popis ključnih i važnih subjekata i redovito ga preispituje ' +
        '(čl. 3. st. 3.) te može obuhvatiti i lokalnu javnu upravu i obrazovne ustanove (čl. 2. st. 5.). U Hrvatskoj je ' +
        'direktiva prenesena Zakonom o kibernetičkoj sigurnosti (NN 14/2024) i uredbom Vlade donesenom na temelju ' +
        'njega; i zakon govori o ključnim i važnim subjektima. Subjekte razvrstavaju nadležna tijela i o tome ih ' +
        'obavješćuju; subjekt to ne odlučuje sam.</p>' +
        '<p><b>Pojednostavljeno:</b> brojke povezanih i partnerskih poduzeća (grupe) se zbrajaju, a veličina se mijenja tek ' +
        'nakon dvije uzastopne godine iznad ili ispod granice; financijski subjekti slijede DORA-u (čl. 4.); nekvalificirani ' +
        'pružatelji usluga povjerenja i regionalna uprava nisu prikazani.</p>'
    },
    en: {
      stage: 'The organisation: sector, size and special roles; the NIS2 scope table with the class that follows; what that class means for supervision and fines',
      headOrg: 'The organisation',
      headScope: 'In scope? The scope table',
      headFollows: 'What follows',
      foot: 'Simplified, not legal advice. The organisations and their figures are made up; the ceilings and fines are from the directive. The national law and the authorities\' lists have the final word.',

      pSector: 'Sector',
      pStaff: 'Staff',
      pTurnover: 'Yearly turnover',
      pBalance: 'Balance sheet total',

      s_energy: 'Energy (electricity, gas, heating)',
      s_transport: 'Transport',
      s_health: 'Health (a hospital)',
      s_water: 'Drinking water supply',
      s_cloud: 'Cloud computing or data centre',
      s_msp: 'Managed IT or security services',
      s_postal: 'Postal and courier services',
      s_waste: 'Waste management',
      s_food: 'Food production and distribution',
      s_manufacturing: 'Making machinery, electronics, vehicles',
      s_chemicals: 'Chemicals',
      s_digital: 'Online marketplace, search engine or social network',
      s_research: 'Research organisation',
      s_central: 'Central government body',
      s_local: 'Local government (a municipality)',
      s_retail: 'Retail and web shop',
      s_software: 'Custom software development',
      s_tourism: 'Hotels and tourism',

      g_annex1: 'Annex I: sector of high criticality',
      g_annex2: 'Annex II: one of the other critical sectors',
      g_central: 'Public administration, central government',
      g_local: 'Public administration, local level',
      g_unlisted: 'Not in the directive\'s lists',
      gs_annex1: 'Annex I',
      gs_annex2: 'Annex II',
      gs_central: 'public administration',
      gs_local: 'public administration',
      gs_unlisted: 'not listed',

      rStaff: 'Staff (annual work units)',
      rTurnover: 'Yearly turnover',
      rBalance: 'Balance sheet total',
      eurM: '€{v}M',
      z_micro: 'Micro',
      z_small: 'Small',
      z_medium: 'Medium',
      z_large: 'Large',
      zs_micro: 'Micro',
      zs_small: 'Small',
      zs_medium: 'Med.',
      zs_large: 'Large',
      zw_micro: 'Micro enterprise',
      zw_small: 'Small enterprise',
      zw_medium: 'Medium enterprise',
      zw_large: 'Large enterprise',
      headSize: 'Size',
      ceil0: 'Micro ceiling:',
      ceil1: 'Small ceiling:',
      ceil2: 'Medium ceiling:',
      ceilOver: 'Over the medium ceiling:',
      ceilStaff: 'fewer than {n} staff',
      ceilTurnover: 'turnover ≤ {v}',
      ceilBalance: 'balance sheet ≤ {v}',
      and: 'and',
      or: 'or',
      yes: 'yes',
      no: 'no',

      colRow: 'What the organisation is',
      groupSector: 'Sector',
      groupRoles: 'Special roles (switch on or off)',
      r_annex1: 'Annex I: high criticality',
      r_annex2: 'Annex II: other critical',
      r_central: 'Central government',
      r_local: 'Local government',
      r_unlisted: 'Sector not listed',
      r_telecom: 'Public electronic communications',
      r_dns: 'DNS or top-level-domain registry',
      r_qtsp: 'Qualified trust services',
      r_named: 'Named by the state',
      c_out: '–',
      c_important: 'I',
      c_essential: 'E',
      cl_out: 'Out of scope',
      cl_important: 'Important entity',
      cl_essential: 'Essential entity',
      cellLabel: '{row}, {size}: {cls}',
      rowOn: 'applies',
      decidedBy: 'Decided by the row "{row}", column "{size}".',
      outBy_small: 'The sector is listed, but the organisation is under the size cap.',
      outBy_unlisted: 'The sector is not in the directive\'s lists; size changes nothing.',
      outBy_local: 'The local level is in only if national law adds it.',

      youHere: '▼ this organisation',
      fSup: 'Supervision',
      supE: 'Before and after: inspections, regular and targeted audits, security scans, even without a cause',
      supI: 'After the fact: when there is evidence, an indication or information of non-compliance',
      fObl: 'Obligations',
      oblBoth: 'The same for both classes: risk-management measures, significant-incident reports at 24 h, 72 h and one month, management approves the measures and answers for them',
      fFine: 'Maximum fine at least',
      fineE: '€10M or 2% of worldwide turnover, whichever is higher',
      fineI: '€7M or 1.4% of worldwide turnover, whichever is higher',
      fFineOrg: 'At a turnover of {t}',
      byFixed: 'the fixed sum decides',
      byPct: '{p} of turnover decides',
      pctE: '2%',
      pctI: '1.4%',
      publicFine: 'For public administration bodies national law decides whether fines apply.',
      fMgr: 'Management',
      mgrE: 'A temporary ban from managerial functions is possible',
      mgrI: 'No such measure',
      mgrPublic: 'For public administration bodies the temporary ban does not apply.',
      outBox: 'NIS2 does not apply to this organisation: none of the supervision or fines in the table. Other obligations remain (GDPR, contracts), and national law or the state\'s list can still bring it in.',

      cap_annex1_essential: 'A large enterprise in a sector of high criticality: {cls}.',
      cap_annex1_important: 'A medium enterprise in a sector of high criticality: {cls}.',
      cap_annex2_important: 'A {size} in an Annex II (other critical) sector: {cls}.',
      cap_central_essential: 'A central government body, whatever its size: {cls}.',
      cap_telecom_essential: 'A public electronic communications provider of medium size or more: {cls}.',
      cap_telecom_important: 'A small public electronic communications provider: {cls}.',
      cap_dns_essential: 'A DNS service provider or top-level-domain registry, whatever its size: {cls}.',
      cap_qtsp_essential: 'A qualified trust service provider, whatever its size: {cls}.',
      cap_named_essential: 'Named by the state, whatever its size: {cls}.',
      capOut_small: 'A {size} in a listed sector, under the size cap: {cls}.',
      capOut_unlisted: 'The sector is not in the directive\'s lists: {cls}, however big.',
      capOut_local: 'Local government: {cls}, unless national law brings it in.',
      nUp2: 'With 50 staff or more, or turnover and balance sheet both above €10M, it would become an {cls}.',
      nUp3: 'With 250 staff or more, or turnover above €50M and balance sheet above €43M, it would become an {cls}.',
      nDown1: 'With fewer than 50 staff and turnover or balance sheet up to €10M it would be an {cls}.',
      nDown2: 'With fewer than 250 staff and turnover up to €50M or balance sheet up to €43M it would be an {cls}.',
      nCap: 'In an Annex II sector no size makes it essential; only a special role or the state\'s decision can.',
      nAny: 'Size changes nothing here.',
      nNever: 'No size changes that; only a special role or national law can bring it in.',
      nNamedIdle: 'The state can name only entities of a type in the directive\'s lists, so that switch does nothing here.',
      nSeveral: 'Several rows apply; the strictest counts.',

      legE: 'E: essential entity',
      legI: 'I: important entity',
      legOut: '–: out of scope',
      legDecide: 'the deciding cell',
      legCol: 'the column of its size',

      pWater: 'Regional water utility',
      pWaterHint: 'A sector of high criticality, 180 staff. What changes at 250?',
      pMsp: 'Managed IT services',
      pMspHint: 'Turnover €62M, balance sheet €38M: medium or large?',
      pMachines: 'Machinery maker',
      pMachinesHint: 'A large enterprise in an Annex II sector; compare with energy.',
      pShop: 'Retail chain',
      pShopHint: '1,000 staff and €200M turnover, but the sector is not listed.',
      pDns: 'Small firm that runs DNS',
      pDnsHint: 'Nine people write software and run DNS for their clients.',
      pAgency: 'Government agency',
      pAgencyHint: '49 staff in central government; compare with a water utility of the same size.',

      explain:
        '<p><b>Who is in.</b> The NIS2 Directive (Directive (EU) 2022/2555, art. 2(1)) covers entities of a type listed ' +
        'in Annex I (<i>sectors of high criticality</i>: energy, transport, banking, health, water, digital ' +
        'infrastructure, ICT service management, public administration, space) or Annex II (<i>other critical ' +
        'sectors</i>: postal, waste, chemicals, food, manufacturing, digital providers, research) that are at least ' +
        '<i>medium-sized enterprises</i> under Recommendation 2003/361/EC: a medium enterprise has fewer than 250 staff ' +
        'and a yearly turnover up to €50M <i>or</i> a balance sheet total up to €43M; a small one fewer than 50 and up to ' +
        '€10M; a micro one fewer than 10 and up to €2M. The headcount is a must; of the two money figures, one is ' +
        'enough.</p>' +
        '<p><b>Essential and important entities</b> (art. 3). Essential are large enterprises in Annex I; qualified trust ' +
        'service providers, top-level-domain name registries and DNS service providers of any size; providers of public ' +
        'electronic communications networks or services from medium size; central government bodies; and entities the ' +
        'state names (the sole provider of an essential service, critical entities; art. 2(2)(b)–(e) and 2(3)). Every ' +
        'other entity in scope is important (art. 3(2)).</p>' +
        '<p><b>What the class changes.</b> The obligations are the same: management approves the cybersecurity ' +
        'risk-management measures and answers for them (art. 20), the measures (art. 21), reporting a significant ' +
        'incident at 24 hours, 72 hours and one month (art. 23). Supervision differs: essential entities are checked ' +
        'before and after the fact (<i>ex ante</i> and <i>ex post</i>: inspections, random checks, regular and targeted ' +
        'audits, security scans; art. 32), important ones only after the fact, on evidence or an indication (art. 33). A ' +
        'temporary ban from managerial functions exists for essential entities only (art. 32(5)). The maximum fine must ' +
        'be at least €10M or 2% of the undertaking\'s total worldwide yearly turnover, whichever is higher, for essential ' +
        'entities, and €7M or 1.4% for important ones (art. 34(4) and (5)): up to €500M of turnover the fixed sum ' +
        'decides, above it the share. For public administration the state decides whether fines apply (art. 34(7)).</p>' +
        '<p><b>The state has the final word.</b> It draws up the list of essential and important entities and reviews it ' +
        'regularly (art. 3(3)), and may add local public administration and education institutions (art. 2(5)). In ' +
        'Croatia the directive is implemented by the Zakon o kibernetičkoj sigurnosti (Cybersecurity Act, NN 14/2024) ' +
        'and a government regulation under it; the law, too, speaks of essential and important entities (ključni i ' +
        'važni subjekti). The competent authorities categorise entities and notify them; an entity does not decide ' +
        'this itself.</p>' +
        '<p><b>Simplified:</b> the figures of linked and partner enterprises (a group) are added, and the size class ' +
        'changes only after two consecutive years over or under a ceiling; financial entities follow DORA (art. 4); ' +
        'non-qualified trust service providers and regional government are not shown.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
