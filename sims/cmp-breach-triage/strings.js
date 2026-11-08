/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of cmp-breach-triage, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json (title, concept). Croatian terms: NOTES.md "Term pairs". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Trijaža povrede osobnih podataka: evidentirati, prijaviti, obavijestiti',

      // the case card
      caseLaptop: 'Ukradeni laptop',
      caseEmail: 'Pogrešan primatelj',
      caseRansomware: 'Ucjena s krađom podataka',
      caseRestore: 'Obnova bez dva dana',
      whatLaptop: 'Prodavaču je iz auta ukraden laptop s podacima kupaca.',
      whatEmail: 'Automatsko dovršavanje adrese poslalo je tablicu osobi izvan tvrtke.',
      whatRansomware: 'Ucjenjivački program šifrirao je poslužitelj datoteka; napadači su prije toga kopirali datoteke van.',
      whatRestore: 'Baza kupaca se pokvarila i vraćena je iz sigurnosne kopije stare dva dana.',
      encLaptop: 'disk je šifriran, a lozinka nije bila uz laptop',
      encEmail: 'privitak je šifriran, a lozinka je poslana drugim putem',
      encRansomware: 'kopirane datoteke bile su šifrirane, a ključ nije odnesen',
      recLaptop: 'popis je vraćen iz sigurnosne kopije',
      recRansomware: 'poslužitelj je vraćen iz sigurnosne kopije',
      recRestore: 'dva dana unosa ponovno su upisana iz e-pošte i obrazaca',
      fData: 'Podaci',
      fPeople: 'Ljudi',
      fAware: 'Saznanje',
      peopleN: ['{num} osoba', '{num} osobe', '{num} osoba'],
      peopleAcc: ['{num} osobu', '{num} osobe', '{num} osoba'],
      thou: '.',

      // confidentiality, integrity, availability
      kindC: 'Povjerljivost',
      kindI: 'Cjelovitost',
      kindA: 'Dostupnost',
      stNone: 'nije pogođena',
      stUnknown: '?',
      stLost: '✗ izgubljena',
      stContained: '✓ zaštićena',
      and: 'i',

      // the questions
      qBreach: 'Povreda osobnih podataka?',
      qConf: 'Šifrirano, ključ siguran?',
      qAvail: 'Vraćeno na vrijeme?',
      qRisk: 'Rizik za ljude?',
      aWait: '…',
      aBreach: 'da: {losses}',
      aConfSafe: 'da: {enc}',
      aConfLost: 'šifrirano, ali ključ je izgubljen s podacima',
      aConfPlain: 'ne: tko ima podatke, može ih čitati',
      aConfNone: '– povjerljivost nije pogođena',
      aAvailBack: 'da: {rec}',
      aAvailGone: 'ne: podaci su nestali ili netočni',
      aAvailNone: '– ništa nije nestalo ni promijenjeno',
      aRisk: '{level}',
      lvlUnlikely: 'malo vjerojatan',
      lvlRisk: 'vjerojatan',
      lvlHigh: 'visok',

      // the score meter
      mScore: 'Bodovi',
      mParts: '{data} {dataPts} + {scale} {scalePts} = {score}',
      mScale: 'broj ljudi',
      mNothing: 'ništa ne ostaje: 0',
      zRecord: 'evidentirati',
      zNotify: 'prijaviti',
      zInform: '+ obavijestiti',
      mWithout: 'bez kontrola',

      // the outcomes
      outRecord: 'Evidentirati',
      outRecordSub: 'interna evidencija povreda, uvijek',
      outNotify: 'Prijaviti',
      outNotifySub: 'nadzornom tijelu, bez odgađanja, najkasnije 72 h od saznanja',
      outInform: 'Obavijestiti',
      outInformSub: 'ljude na koje se podaci odnose',
      bPending: '?',
      bRecorded: '✓ upisano',
      bYes: '✓ potrebno',
      bNo: '– nije potrebno',
      bDue: 'rok {due}',
      bFiled: 'predano {filed}',
      bInform: 'bez nepotrebnog odgađanja',
      decRecord: 'samo evidentirati',
      decNotify: 'evidentirati i prijaviti',
      decInform: 'evidentirati, prijaviti i obavijestiti ljude',
      foot: 'Pojednostavljeno, nije pravni savjet. Tvrtka, slučajevi, bodovi i pragovi su izmišljeni; stvarna procjena ' +
        'rizika važe više okolnosti.',

      // dates
      wd0: 'pon', wd1: 'uto', wd2: 'sri', wd3: 'čet', wd4: 'pet', wd5: 'sub', wd6: 'ned',
      mo1: '1.', mo2: '2.', mo3: '3.', mo4: '4.', mo5: '5.', mo6: '6.',
      mo7: '7.', mo8: '8.', mo9: '9.', mo10: '10.', mo11: '11.', mo12: '12.',
      timeFmt: '{wd} {d}. {mon} {hh}:00',

      // params
      pCase: 'Slučaj',
      pEnc: 'Šifriranje',
      oEncNone: 'nema',
      oEncSafe: 'ključ siguran',
      oEncLost: 'ključ izgubljen',
      pRecovered: 'Vraćeno na vrijeme',
      pData: 'Podaci',
      dataContact: 'kontaktni podaci',
      dataFinancial: 'financijski podaci',
      dataSpecial: 'zdravstveni podaci',
      dataSContact: 'ime, e-mail, telefon',
      dataSFinancial: 'brojevi računa, plaće',
      dataSSpecial: 'posebna kategorija',
      pPeople: 'Broj ljudi',

      // presets
      prLaptopEncrypted: 'Laptop, šifriran',
      prLaptopEncryptedHint: 'Šifriran disk i sigurnosna kopija: povreda se samo evidentira.',
      prLaptopKeyLost: 'Laptop, lozinka u torbi',
      prLaptopKeyLostHint: 'Isti laptop, ali lozinka je bila na papiriću uz njega.',
      prWrongEmail: 'Plaće krivoj osobi',
      prWrongEmailHint: 'Plaće deset osoba u tablici poslanoj pogrešnom primatelju.',
      prSickNote: 'Bolovanje krivoj osobi',
      prSickNoteHint: 'Zdravstveni podaci jedne osobe: i jedna osoba može značiti visok rizik.',
      prRansomware: 'Ucjena s krađom',
      prRansomwareHint: 'Sigurnosna kopija vraća datoteke, ali ono što je kopirano van ostaje vani.',
      prRestore: 'Obnova bez dva dana',
      prRestoreHint: 'Samo dostupnost i cjelovitost: i to je povreda, i ide u evidenciju.',

      // legend
      legLost: 'izgubljeno',
      legContained: 'zaštićeno',
      legWithout: 'bez kontrola',

      // captions
      cCaseLaptop: 'Prodavaču je iz auta ukraden laptop: na njemu su {data} za {people}. Krađa je prijavljena ' +
        'sljedeće jutro, a tvrtka zna što se dogodilo ({aware}). Samo evidentirati, prijaviti ili i obavijestiti ljude? ' +
        'Pritisni →.',
      cCaseEmail: 'Automatsko dovršavanje adrese poslalo je tablicu osobi izvan tvrtke: {data} za {people}. ' +
        'Pošiljatelj je to primijetio unutar sata; saznanje {aware}. Samo evidentirati, prijaviti ili i obavijestiti ' +
        'ljude? Pritisni →.',
      cCaseRansomware: 'Ucjenjivački program ({attack}) šifrira poslužitelj datoteka; napadači su prije toga kopirali ' +
        'datoteke van: {data} za {people}. Saznanje {aware}. Samo evidentirati, prijaviti ili i obavijestiti ljude? ' +
        'Pritisni →.',
      cCaseRestore: 'Baza kupaca se pokvarila i vraćena je iz kopije stare dva dana: unosa iz ta dva dana nema, a neki ' +
        'zapisi opet imaju stare vrijednosti ({data} za {people}). Saznanje {aware}. Samo evidentirati, prijaviti ili ' +
        'i obavijestiti ljude? Pritisni →.',
      cBreach: 'To je povreda osobnih podataka; pogođeno: {losses}. Odmah se upisuje u internu evidenciju povreda, ' +
        'kakva god bude daljnja odluka.',
      cConfSafe: 'Povjerljivost: {enc}. Tko god ima podatke, bez ključa ih ne može pročitati, pa je taj gubitak zaštićen.',
      cConfLost: 'Povjerljivost: podaci su šifrirani, ali ključ (lozinka) otišao je zajedno s njima. Šifriranje bez ' +
        'sigurnog ključa ne vrijedi ništa: gubitak ostaje.',
      cConfPlain: 'Povjerljivost: podaci nisu šifrirani. Tko ih ima, može ih pročitati: gubitak ostaje.',
      cConfNone: 'Povjerljivost: nitko izvana nije dobio podatke, pa šifriranje ovdje ništa ne mijenja.',
      cAvailBack: 'Nestali podaci: {rec}, na vrijeme, prije nego što je ikome naštetilo. Taj je gubitak zaštićen.',
      cAvailGone: 'Nestali podaci nisu vraćeni na vrijeme. Ljudi na koje se odnose mogu ostati bez usluge ili s ' +
        'netočnim podacima: gubitak ostaje.',
      cAvailNone: 'Ništa nije nestalo ni promijenjeno. A poslana poruka ne može se vratiti: povjerljivost se ne ' +
        'obnavlja iz sigurnosne kopije.',
      cRiskContained: 'Rizik za ljude: svaki je gubitak zaštićen, pa povreda vjerojatno neće prouzročiti rizik. ' +
        'Bodovi: 0.',
      cRiskScore: 'Rizik za ljude, iz onoga što ostaje: {data} {dataPts}, broj ljudi {scalePts}; ukupno {score}.',
      cRiskUnlikely: 'Ispod praga od 2 boda: rizik je malo vjerojatan.',
      cRiskRisk: 'Na pragu od 2 boda: povreda vjerojatno donosi rizik za ljude.',
      cRiskHigh: 'Od 3 boda naviše: rizik za ljude je visok.',
      cNotifyYes: 'Prijava nadzornom tijelu je obvezna, bez nepotrebnog odgađanja i najkasnije 72 sata od saznanja ' +
        '({due}); prijava je predana {filed}.',
      cNotifyNo: 'Prijava nadzornom tijelu nije potrebna. U evidenciju se upisuje i zašto: što se dogodilo, što je ' +
        'zaštitilo podatke i kako je odlučeno.',
      cInformYes: 'Obavijestiti ljude: da, bez nepotrebnog odgađanja i jasnim jezikom: što se dogodilo, moguće ' +
        'posljedice, što je tvrtka poduzela i što sami mogu učiniti.',
      cInformNoHigh: 'Obavijestiti ljude: ne. Rizik postoji, ali nije visok; nadzorno tijelo ipak može zatražiti ' +
        'obavijest.',
      cInformNo: 'Obavijestiti ljude: ne, rizik je malo vjerojatan.',
      cSumRecord: 'Odluka: samo evidentirati. Povreda je u internoj evidenciji, a prijave nema.',
      cSumNotify: 'Odluka: evidentirati i prijaviti nadzornom tijelu.',
      cSumInform: 'Odluka: evidentirati, prijaviti nadzornom tijelu i obavijestiti ljude.',
      cSumWithout: 'Bez šifriranja i bez vraćanja ista bi povreda značila: {without}.',
      cSumWith: 'S uključenim kontrolama (šifriranje uz siguran ključ, vraćanje na vrijeme) bilo bi: {with}.',

      explain:
        '<p><b>Što je povreda.</b> <b>Povreda osobnih podataka</b> (<i>personal-data breach</i>) je sigurnosni ' +
        'incident koji dovodi do gubitka <b>povjerljivosti</b> (netko neovlašten vidi podatke), <b>cjelovitosti</b> ' +
        '(podaci su izmijenjeni) ili <b>dostupnosti</b> (podaci su nestali ili nedostupni) (Opća uredba o zaštiti ' +
        'podataka, GDPR, čl. 4. t. 12.). Obnova koja izgubi dva dana unosa jest povreda, iako nitko ništa nije ' +
        'ukrao.</p>' +
        '<p><b>Tri koraka, svaki sa svojim pragom.</b> <b>Evidentirati</b> uvijek: voditelj obrade dokumentira svaku ' +
        'povredu, njezine posljedice i poduzete mjere (čl. 33. st. 5.; smjernice EDPB-a dodaju i razloge kad se ne ' +
        'prijavljuje). ' +
        '<b>Prijaviti</b> <b>nadzornom tijelu</b> (<i>supervisory authority</i>; u Hrvatskoj je to Agencija za ' +
        'zaštitu osobnih podataka, AZOP) u roku od 72 sata od saznanja, osim ' +
        'ako nije vjerojatno da će povreda prouzročiti rizik za prava i slobode pojedinaca (čl. 33. st. 1.; rokove ' +
        'pokazuje <i>cmp-incident-clocks</i>). <b>Obavijestiti</b> <b>ispitanike</b> (<i>data subjects</i>) bez ' +
        'nepotrebnog odgađanja kad je rizik visok (čl. 34. st. 1.).</p>' +
        '<p><b>Što pokazuje pozornica.</b> Šifriranje štiti samo povjerljivost i samo dok je ključ siguran: ' +
        'podaci su tada nerazumljivi svakome tko im nije ovlašten pristupiti. Uz sigurnosnu kopiju smjernice Europskog ' +
        'odbora za zaštitu podataka (9/2022) takav ukradeni laptop smatraju povredom koja vjerojatno neće prouzročiti ' +
        'rizik: ne prijavljuje se (čl. 33. st. 1.), ljude ne treba obavijestiti (čl. 34. st. 3. t. a), a ipak se ' +
        'evidentira (čl. 33. st. 5.). Lozinka na ' +
        'papiriću u torbi vraća sve na početak. Sigurnosna kopija štiti dostupnost, ne povjerljivost: poslužitelj ' +
        'vraćen nakon <b>ucjenjivačkog programa</b> (<i>ransomware</i>) ne vraća datoteke koje su napadači već ' +
        'kopirali, a poslana poruka ne može se vratiti. I jedna osoba može značiti visok rizik ako su podaci ' +
        'zdravstveni.</p>' +
        '<p><b>Pojednostavljeno.</b> Bodovi i pragovi su izmišljeni da bi se odluka mogla pratiti. Smjernice EDPB-a ' +
        'važu vrstu i osjetljivost podataka, broj ljudi, koliko ih je lako prepoznati, težinu i trajnost posljedica, ' +
        'posebno ranjive ljude (na primjer djecu) i namjeru napadača. Izostavljeni su obavijest izvršitelja obrade ' +
        'voditelju (čl. 33. st. 2.), javno priopćenje kad bi pojedinačna obavijest zahtijevala nerazmjeran napor ' +
        '(čl. 34. st. 3. t. c) i prijava istog incidenta prema NIS2. Zakon o provedbi Opće uredbe o zaštiti ' +
        'podataka (NN 42/2018) dodaje nacionalna pravila, na primjer o kaznama za tijela javne vlasti. Nije pravni ' +
        'savjet.</p>',
    },
    en: {
      stage: 'Triage of a personal-data breach: record, notify, inform',

      caseLaptop: 'Stolen laptop',
      caseEmail: 'Wrong recipient',
      caseRansomware: 'Ransomware that took data',
      caseRestore: 'A restore that lost two days',
      whatLaptop: 'A sales rep’s laptop holding customer data is stolen from a car.',
      whatEmail: 'Address autocomplete sends a spreadsheet to someone outside the firm.',
      whatRansomware: 'Ransomware encrypts the file server; the attackers copied files out first.',
      whatRestore: 'The customer database fails and is restored from a backup two days old.',
      encLaptop: 'the disk is encrypted and the password was not with the laptop',
      encEmail: 'the attachment is encrypted and the password went another way',
      encRansomware: 'the copied files were encrypted and the key was not taken',
      recLaptop: 'the list was restored from a backup',
      recRansomware: 'the server was restored from a backup',
      recRestore: 'the two days of entries were re-entered from e-mails and forms',
      fData: 'Data',
      fPeople: 'People',
      fAware: 'Aware',
      peopleN: ['{num} person', '{num} people'],
      peopleAcc: ['{num} person', '{num} people'],
      thou: ',',

      kindC: 'Confidentiality',
      kindI: 'Integrity',
      kindA: 'Availability',
      stNone: 'not hit',
      stUnknown: '?',
      stLost: '✗ lost',
      stContained: '✓ contained',
      and: 'and',

      qBreach: 'A personal-data breach?',
      qConf: 'Encrypted, key safe?',
      qAvail: 'Recovered in time?',
      qRisk: 'Risk to people?',
      aWait: '…',
      aBreach: 'yes: {losses}',
      aConfSafe: 'yes: {enc}',
      aConfLost: 'encrypted, but the key went with the data',
      aConfPlain: 'no: whoever has the data can read it',
      aConfNone: '– confidentiality not hit',
      aAvailBack: 'yes: {rec}',
      aAvailGone: 'no: the data is gone or wrong',
      aAvailNone: '– nothing went missing or changed',
      aRisk: '{level}',
      lvlUnlikely: 'unlikely',
      lvlRisk: 'likely',
      lvlHigh: 'high',

      mScore: 'Score',
      mParts: '{data} {dataPts} + {scale} {scalePts} = {score}',
      mScale: 'people',
      mNothing: 'nothing left: 0',
      zRecord: 'record',
      zNotify: 'notify',
      zInform: '+ inform',
      mWithout: 'without the controls',

      outRecord: 'Record',
      outRecordSub: 'internal breach register, always',
      outNotify: 'Notify',
      outNotifySub: 'the supervisory authority, without undue delay, at most 72 h from awareness',
      outInform: 'Inform',
      outInformSub: 'the people the data is about',
      bPending: '?',
      bRecorded: '✓ recorded',
      bYes: '✓ required',
      bNo: '– not required',
      bDue: 'due {due}',
      bFiled: 'filed {filed}',
      bInform: 'without undue delay',
      decRecord: 'record only',
      decNotify: 'record and notify',
      decInform: 'record, notify and inform the people',
      foot: 'Simplified, not legal advice. The firm, the cases, the points and the thresholds are made up; a real risk ' +
        'assessment weighs more circumstances.',

      wd0: 'Mon', wd1: 'Tue', wd2: 'Wed', wd3: 'Thu', wd4: 'Fri', wd5: 'Sat', wd6: 'Sun',
      mo1: 'Jan', mo2: 'Feb', mo3: 'Mar', mo4: 'Apr', mo5: 'May', mo6: 'Jun',
      mo7: 'Jul', mo8: 'Aug', mo9: 'Sep', mo10: 'Oct', mo11: 'Nov', mo12: 'Dec',
      timeFmt: '{wd} {d} {mon} {hh}:00',

      pCase: 'Case',
      pEnc: 'Encryption',
      oEncNone: 'none',
      oEncSafe: 'key safe',
      oEncLost: 'key lost',
      pRecovered: 'Recovered in time',
      pData: 'Data',
      dataContact: 'contact details',
      dataFinancial: 'financial data',
      dataSpecial: 'health data',
      dataSContact: 'name, e-mail, phone',
      dataSFinancial: 'account numbers, salaries',
      dataSSpecial: 'special category',
      pPeople: 'People',

      prLaptopEncrypted: 'Laptop, encrypted',
      prLaptopEncryptedHint: 'An encrypted disk and a backup: the breach is only recorded.',
      prLaptopKeyLost: 'Laptop, password in the bag',
      prLaptopKeyLostHint: 'The same laptop, but the password was on a note beside it.',
      prWrongEmail: 'Salaries, wrong recipient',
      prWrongEmailHint: 'Ten people’s salaries in a spreadsheet sent to the wrong person.',
      prSickNote: 'Sick note, wrong recipient',
      prSickNoteHint: 'One person’s health data: even one person can mean a high risk.',
      prRansomware: 'Ransomware with theft',
      prRansomwareHint: 'The backup brings the files back, but what was copied out stays out.',
      prRestore: 'Restore, two days lost',
      prRestoreHint: 'Only availability and integrity: still a breach, and it goes in the register.',

      legLost: 'lost',
      legContained: 'contained',
      legWithout: 'without the controls',

      cCaseLaptop: 'A sales rep’s laptop is stolen from a car; it holds {data} on {people}. The theft is reported ' +
        'next morning, and the firm knows what happened by {aware}. Record only, notify, or inform the people as well? ' +
        'Press →.',
      cCaseEmail: 'Address autocomplete sends a spreadsheet to someone outside the firm: {data} on {people}. The ' +
        'sender notices within the hour; aware {aware}. Record only, notify, or inform the people as well? Press →.',
      cCaseRansomware: 'Ransomware encrypts the file server on {attack}; the attackers copied files out first: {data} on ' +
        '{people}. Aware {aware}. Record only, notify, or inform the people as well? Press →.',
      cCaseRestore: 'The customer database fails and is restored from a backup two days old: the entries of those two ' +
        'days are gone, and some records are back to old values ({data} on {people}). Aware {aware}. Record only, ' +
        'notify, or inform the people as well? Press →.',
      cBreach: 'This is a personal-data breach; hit: {losses}. It goes into the internal breach register now, ' +
        'whatever the decision turns out to be.',
      cConfSafe: 'Confidentiality: {enc}. Whoever has the data cannot read it without the key, so that loss is contained.',
      cConfLost: 'Confidentiality: the data was encrypted, but the key (password) went with it. Encryption without ' +
        'a safe key counts for nothing: the loss stands.',
      cConfPlain: 'Confidentiality: the data was not encrypted. Whoever has it can read it: the loss stands.',
      cConfNone: 'Confidentiality: nobody outside got the data, so encryption changes nothing here.',
      cAvailBack: 'What went missing: {rec}, in time, before it harmed anyone. That loss is contained.',
      cAvailGone: 'What went missing was not recovered in time. The people it concerns may go without a service or ' +
        'with wrong records: the loss stands.',
      cAvailNone: 'Nothing went missing or changed. And a sent e-mail cannot be taken back: confidentiality is not ' +
        'restored from a backup.',
      cRiskContained: 'Risk to people: every loss is contained, so the breach is unlikely to result in a risk. Score: 0.',
      cRiskScore: 'Risk to people, from what remains: {data} {dataPts}, number of people {scalePts}; {score} in all.',
      cRiskUnlikely: 'Below the threshold of 2 points: a risk is unlikely.',
      cRiskRisk: 'At the threshold of 2 points: the breach is likely to result in a risk to people.',
      cRiskHigh: '3 points or more: the risk to people is high.',
      cNotifyYes: 'Notifying the supervisory authority is required, without undue delay and at most 72 hours after ' +
        'awareness ({due}); the notification went out {filed}.',
      cNotifyNo: 'No notification to the supervisory authority is needed. The register records why: what happened, ' +
        'what protected the data and how the decision was made.',
      cInformYes: 'Inform the people: yes, without undue delay and in plain language: what happened, the likely ' +
        'consequences, what the firm has done and what they can do themselves.',
      cInformNoHigh: 'Inform the people: no. There is a risk, but not a high one; the supervisory authority may still ' +
        'require it.',
      cInformNo: 'Inform the people: no, a risk is unlikely.',
      cSumRecord: 'Decision: record only. The breach is in the internal register; nothing is notified.',
      cSumNotify: 'Decision: record, and notify the supervisory authority.',
      cSumInform: 'Decision: record, notify the supervisory authority and inform the people.',
      cSumWithout: 'Without the encryption and the recovery, the same breach would mean: {without}.',
      cSumWith: 'With the controls on (encryption with a safe key, recovery in time) it would be: {with}.',

      explain:
        '<p><b>What a breach is.</b> A <b>personal-data breach</b> is a security incident that leads to a loss of ' +
        '<b>confidentiality</b> (someone unauthorised sees the data), <b>integrity</b> (the data is altered) or ' +
        '<b>availability</b> (the data is gone or out of reach) (GDPR, Regulation (EU) 2016/679, art. 4(12)). A ' +
        'restore that loses two days of entries is a breach, though nobody stole anything.</p>' +
        '<p><b>Three steps, each with its own threshold.</b> <b>Record</b> always: the controller documents every ' +
        'breach, its effects and the remedial action taken (art. 33(5); the EDPB adds the reasons for not notifying). ' +
        '<b>Notify</b> the <b>supervisory authority</b> (in Croatia the Agencija za zaštitu osobnih podataka, AZOP) ' +
        'within 72 hours of becoming aware, unless the breach is ' +
        'unlikely to result in a risk to the rights and freedoms of people (art. 33(1); the clocks are ' +
        '<i>cmp-incident-clocks</i>). <b>Inform</b> the <b>data subjects</b> without undue delay when the risk is ' +
        'high (art. 34(1)).</p>' +
        '<p><b>What the stage shows.</b> Encryption protects confidentiality only, and only while the key is safe: ' +
        'the data is then unintelligible to anyone not authorised to access it. With a backup as well, the European Data ' +
        'Protection Board\u2019s guidelines (9/2022) treat such a stolen laptop as unlikely to result in a risk: it is ' +
        'not notified (art. 33(1)), the people need not be told (art. 34(3)(a)), and it is still recorded ' +
        '(art. 33(5)). A password on a ' +
        'note in the bag undoes it. A backup protects availability, not confidentiality: a server restored after ' +
        '<b>ransomware</b> does not bring back the files the attackers already copied, and a sent e-mail cannot be ' +
        'taken back. Even one person can mean a high risk when the data is about their health.</p>' +
        '<p><b>Simplified.</b> The points and thresholds are made up so that the decision can be followed. The ' +
        'EDPB’s guidelines weigh the type and sensitivity of the data, the number of people, how easily they can ' +
        'be identified, how severe and lasting the consequences are, vulnerable people (children, for example) and ' +
        'the attacker’s intent. Left out: a processor telling the controller (art. 33(2)), a public ' +
        'communication when telling each person would take disproportionate effort (art. 34(3)(c)) and reporting ' +
        'the same incident under NIS2. The Zakon o provedbi Opće uredbe o zaštiti podataka (the Croatian GDPR ' +
        'Implementation Act, NN 42/2018) adds national rules, for example on fines for public bodies. Not legal ' +
        'advice.</p>',
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
