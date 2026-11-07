/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the page, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural forms
   (hr: 1 / 2–4 / 5+, en: 1 / other). The title and subtitle are not here: they come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Tim, dužnosti i matrica sukoba: tko drži oba dijela nespojivog para',

      // the people (made up; the same in both languages)
      n_0: 'Ana', n_1: 'Bruno', n_2: 'Iva', n_3: 'Dino', n_4: 'Maja', n_5: 'Luka',
      n_6: 'Sara', n_7: 'Toni', n_8: 'Petra', n_9: 'Marko', n_10: 'Nina', n_11: 'Filip',
      gOffice: 'Ured',
      gIT: 'IT',

      // the duties, the pairs, and what one person holding both could do
      d_0: 'Traži nabavu',
      d_1: 'Odobrava nabavu',
      d_2: 'Otvara dobavljače',
      d_3: 'Plaća dobavljačima',
      d_4: 'Piše kod',
      d_5: 'Pušta u produkciju',
      d_6: 'Vodi sigurnosne kopije',
      d_7: 'Upravlja zapisima',
      p_0: 'nabava',
      p_1: 'dobavljači',
      p_2: 'kod i produkcija',
      p_3: 'kopije i zapisi',
      a_0: 'kupnja za sebe uz vlastito odobrenje',
      a_1: 'plaćanje izmišljenom dobavljaču',
      a_2: 'u produkciji kod koji nitko nije pregledao',
      a_3: 'obrisana kopija i obrisan zapis koji to pokazuje',

      // the stage
      headPeople: 'Tko što radi',
      headMatrix: 'Matrica sukoba',
      headList: 'Nespojive kombinacije',
      holdersOf: '{h}/{r}',
      cellHeld: '{who}: {duty}, drži',
      cellFree: '{who}: {duty}, ne drži',
      cellNot: '{who}: {duty}, ne smije (drugi odjel)',
      cellConf: '{who}: {duty}, drži i drugi dio para ({o})',
      mxDiag: '{a}: nositelja {h} od potrebnih {r}',
      mxCell: '{a} i {b}: ljudi s obje dužnosti: {n}',
      mxForbid: '{a} i {b}: nespojivo; ljudi s obje dužnosti: {n} ({o})',
      mxSep: 'razdvojeno',
      rowText: '{who}: {pair}',
      byReviewer: 'pregledava {r}',
      rowLabel: '{who}: {pair}. Moguća zlouporaba: {abuse}. Stanje: {o}',
      bSplit: 'Razdvoji',
      bControl: 'Kontrola',
      bAccept: 'Prihvati',
      bSplitLabel: '{who}, {pair}: razdvoji dužnost',
      bControlLabel: '{who}, {pair}: kompenzacijska kontrola',
      bAcceptLabel: '{who}, {pair}: prihvati rizik potpisom',
      o_open: 'otvoreno, zlouporaba ostaje skrivena',
      o_detected: 'zlouporabu otkriva neovisni pregled zapisa',
      o_accepted: 'prihvaćeno potpisom, rizik ostaje',
      o_bad: 'kontrola ne vrijedi',
      listMore: '+ još {k}',
      listNone: 'Nitko ne drži oba dijela nespojivog para.',

      // the numbers
      kConf: 'Sukobi',
      kMin: 'Najmanje moguće',
      kOpen: 'Otvoreni',
      kDet: 'Otkriva pregled',
      kAcc: 'Prihvaćeni',
      kShort: 'Premalo nositelja',
      v_clean: 'Revizija: bez nalaza',
      v_managed: 'Revizija: sukobi pod kontrolom ili prihvaćeni',
      v_finding: 'Revizija: nalaz',

      // params, presets, legend
      team: 'Veličina tima',
      teamHint: 'Ljudi su naizmjence u uredu i u IT-u.',
      deputies: 'Zamjena za svaku dužnost',
      deputiesHint: 'Dva nositelja po dužnosti, za godišnji odmor i bolovanje.',
      share: 'Podijeli dužnosti',
      shareHint: 'Raspodjela s najmanje sukoba za ovaj tim.',
      pMixed: 'Šestero, svatko pomalo',
      pMixedHint: 'Tri nespojiva para, a sva se mogu razdvojiti.',
      pSeparated: 'Šestero, razdvojeno',
      pSeparatedHint: 'Isti tim, dužnosti podijeljene bez sukoba.',
      pCover: 'Šestero sa zamjenama',
      pCoverHint: 'Zamjena za svaku dužnost: troje u uredu i troje u IT-u više ne mogu sve razdvojiti.',
      pThree: 'Troje i kompenzacijska kontrola',
      pThreeHint: 'Jedini u IT-u piše kod i pušta ga; Ana pregledava zapis.',
      pOwnLog: 'Kontrola nad vlastitim zapisom',
      pOwnLogHint: 'Bruno upravlja i zapisima, pa pregled ne dokazuje ništa.',
      pEight: 'Osmero sa zamjenama',
      pEightHint: 'Dovoljno ljudi za razdvajanje i zamjene.',
      legHeld: 'drži dužnost',
      legOpen: 'nespojivo, otvoreno',
      legDet: 'otkriva pregled',
      legAcc: 'prihvaćeno potpisom',
      legNot: 'drugi odjel, ne smije',

      // the caption
      needOne: 'svog nositelja',
      needTwo: 'nositelja i zamjenu',
      nComb: ['{n} nespojiva kombinacija', '{n} nespojive kombinacije', '{n} nespojivih kombinacija'],
      capClean: 'Svaka dužnost ima {need}, a nitko ne drži oba dijela nespojivog para: nitko sam ne može napraviti pogrešku ili počiniti prijevaru i sakriti je.',
      capShort: 'Nitko ne drži oba dijela nespojivog para, ali nekim dužnostima nedostaje nositelj ili zamjena.',
      capOpen: '{c}, otvorenih: {o}. Tamo jedna osoba može napraviti pogrešku ili počiniti prijevaru i sakriti je. Razdvoji dužnost, dodaj kompenzacijsku kontrolu ili prihvati rizik potpisom.',
      capManaged: '{c}, nijedna otvorena. Otkriva neovisni pregled zapisa: {d}; prihvaćeno potpisom: {a} (rizik ostaje, samo je odluka zapisana).',
      capDetected: '{c}, nijedna otvorena: zlouporabu u svakoj otkriva neovisni pregled zapisa, ali tek nakon što se dogodi.',
      capAccepted: '{c}, nijedna otvorena: sve su prihvaćene potpisom. Rizik ostaje, samo je odluka zapisana.',
      nShort: 'Premalo nositelja: {list}.',
      shortItem: '{duty} ({h} od {r})',
      nLogs: '{who}: kontrola ne vrijedi jer može brisati zapise koje pregled čita.',
      nForced: 'Tim od {n} (ured {o}, IT {i}) ne može sve razdvojiti; najmanji mogući broj sukoba: {m}.',
      nForcedDep: 'Tim od {n} (ured {o}, IT {i}) sa zamjenama ne može sve razdvojiti; najmanji mogući broj sukoba: {m}.',
      nAvoidable: 'Ovaj tim može razdvojiti još: {k} (tipka S dijeli dužnosti s najmanje sukoba).',
      msgMove: '{duty}: {from} → {to}.',
      msgShare: 'Dužnosti podijeljene s najmanje sukoba.',
      rejOffice: '{who} radi u uredu, a produkciju i kopije vodi IT.',
      rejIT: '{who} radi u IT-u, a novac tvrtke vodi ured.',
      rejSplit: '{who}, {pair}: nitko drugi ne može preuzeti ni jednu od te dvije dužnosti. Dodaj kontrolu ili prihvati rizik.',

      foot: 'Pojednostavljeno, nije pravni savjet. Tvrtka i ljudi su izmišljeni.',

      explain:
        '<p>Neke dužnosti ne smije držati ista osoba jer bi mogla napraviti pogrešku ili počiniti prijevaru i sama je ' +
        'sakriti: tražiti i odobriti nabavu, otvoriti dobavljača i platiti mu, pisati kod i pustiti ga u produkciju, ' +
        'voditi sigurnosne kopije i upravljati zapisima (logovima) koji ih bilježe. To je <b>razdvajanje dužnosti</b> ' +
        '(<i>segregation of duties</i>), a takav par <b>nespojiva kombinacija</b> (<i>toxic combination</i>).</p>' +
        '<ul>' +
        '<li><b>Matrica sukoba</b> (<i>conflict matrix</i>) navodi zabranjene parove. Provjera je mehanička: za ' +
        'svaki par, tko drži oba dijela? Polja ispod dijagonale pokazuju koliko ljudi drži obje dužnosti; ' +
        'na dijagonali je broj nositelja dužnosti.</li>' +
        '<li><b>Razdvoji:</b> jedna dužnost prelazi na nekoga tko je smije držati i ne drži drugi dio para. ' +
        'Pogreška se tada spriječi prije nego što se dogodi.</li>' +
        '<li><b>Kompenzacijska kontrola</b> (<i>compensating control</i>): kad razdvajanje nije moguće, netko ' +
        'neovisan redovito pregleda zapis o tome što je osoba radila. Pomaže samo ako osoba taj zapis ne može ' +
        'mijenjati ni brisati, i otkriva zlouporabu tek naknadno.</li>' +
        '<li><b>Prihvaćanje rizika</b> potpisom uprave: odluka je zapisana, ali zlouporabu nitko ne otkriva.</li>' +
        '</ul>' +
        '<p>Mali tim ne može uvijek razdvojiti: u timu od troje jedini čovjek u IT-u i piše kod i pušta ga. ' +
        '<b>Zamjena</b> za svaku dužnost (za godišnji odmor i bolovanje) traži dvostruko više ljudi: s njom se sve ' +
        'razdvaja tek od osmero. Srodno: <b>načelo četiri oka</b> (drugi potpis na svakom zahtjevu) i kako se ' +
        'ovlasti gomilaju s dolascima, premještajima i odlascima.</p>' +
        '<p>Odakle: ISO/IEC 27001:2022, kontrola 5.3 (razdvajanje dužnosti); NIS2, Direktiva (EU) 2022/2555, ' +
        'čl. 21. st. 2. t. (i): politike kontrole pristupa.</p>'
    },

    en: {
      stage: 'The team, the duties and the conflict matrix: who holds both halves of a toxic pair',

      n_0: 'Ana', n_1: 'Bruno', n_2: 'Iva', n_3: 'Dino', n_4: 'Maja', n_5: 'Luka',
      n_6: 'Sara', n_7: 'Toni', n_8: 'Petra', n_9: 'Marko', n_10: 'Nina', n_11: 'Filip',
      gOffice: 'Office',
      gIT: 'IT',

      d_0: 'Requests purchases',
      d_1: 'Approves purchases',
      d_2: 'Creates suppliers',
      d_3: 'Pays suppliers',
      d_4: 'Writes code',
      d_5: 'Deploys to production',
      d_6: 'Runs the backups',
      d_7: 'Manages the logs',
      p_0: 'purchases',
      p_1: 'suppliers',
      p_2: 'code and production',
      p_3: 'backups and logs',
      a_0: 'a purchase for themselves, self-approved',
      a_1: 'payments to a made-up supplier',
      a_2: 'code in production that nobody reviewed',
      a_3: 'a deleted backup and a deleted log line that shows it',

      headPeople: 'Who does what',
      headMatrix: 'Conflict matrix',
      headList: 'Toxic combinations',
      holdersOf: '{h}/{r}',
      cellHeld: '{who}: {duty}, held',
      cellFree: '{who}: {duty}, not held',
      cellNot: '{who}: {duty}, not allowed (other department)',
      cellConf: '{who}: {duty}, held with the other half of its pair ({o})',
      mxDiag: '{a}: holders: {h} of {r}',
      mxCell: '{a} and {b}: people holding both: {n}',
      mxForbid: '{a} and {b}: toxic; people holding both: {n} ({o})',
      mxSep: 'separated',
      rowText: '{who}: {pair}',
      byReviewer: 'reviewed by {r}',
      rowLabel: '{who}: {pair}. Possible abuse: {abuse}. State: {o}',
      bSplit: 'Split',
      bControl: 'Control',
      bAccept: 'Accept',
      bSplitLabel: '{who}, {pair}: split the duties',
      bControlLabel: '{who}, {pair}: compensating control',
      bAcceptLabel: '{who}, {pair}: accept the risk with a signature',
      o_open: 'open, an abuse stays hidden',
      o_detected: 'an independent log review finds an abuse',
      o_accepted: 'accepted with a signature, the risk stays',
      o_bad: 'the control does not hold',
      listMore: '+ {k} more',
      listNone: 'Nobody holds both halves of a toxic pair.',

      kConf: 'Conflicts',
      kMin: 'Fewest possible',
      kOpen: 'Open',
      kDet: 'Found by review',
      kAcc: 'Accepted',
      kShort: 'Duties short',
      v_clean: 'Audit: no finding',
      v_managed: 'Audit: conflicts controlled or accepted',
      v_finding: 'Audit: finding',

      team: 'Team size',
      teamHint: 'People alternate between the office and IT.',
      deputies: 'A deputy for every duty',
      deputiesHint: 'Two holders per duty, for holidays and sick leave.',
      share: 'Share out the duties',
      shareHint: 'With the fewest conflicts this team allows.',
      pMixed: 'Six people, a bit of everything',
      pMixedHint: 'Three toxic pairs, and all of them can be split.',
      pSeparated: 'Six people, separated',
      pSeparatedHint: 'The same team, duties shared out without a conflict.',
      pCover: 'Six people with deputies',
      pCoverHint: 'A deputy for every duty: three in the office and three in IT can no longer separate everything.',
      pThree: 'Three people and a compensating control',
      pThreeHint: 'The only one in IT writes code and deploys it; Ana reviews the log.',
      pOwnLog: 'A control over their own log',
      pOwnLogHint: 'Bruno also manages the logs, so the review proves nothing.',
      pEight: 'Eight people with deputies',
      pEightHint: 'Enough people for separation and deputies.',
      legHeld: 'holds the duty',
      legOpen: 'toxic, open',
      legDet: 'found by review',
      legAcc: 'accepted, signed',
      legNot: 'other department, not allowed',

      needOne: 'its holder',
      needTwo: 'a holder and a deputy',
      nComb: ['{n} toxic combination', '{n} toxic combinations'],
      capClean: 'Every duty has {need}, and nobody holds both halves of a toxic pair: nobody can make an error or commit fraud and hide it alone.',
      capShort: 'Nobody holds both halves of a toxic pair, but some duties lack a holder or a deputy.',
      capOpen: '{c}, {o} open. There one person can make an error or commit fraud and hide it. Split the duties, add a compensating control or accept the risk with a signature.',
      capManaged: '{c}, none open. Found by an independent log review: {d}; accepted with a signature: {a} (the risk stays, only the decision is on record).',
      capDetected: '{c}, none open: an independent log review finds an abuse in each, but only after it has happened.',
      capAccepted: '{c}, none open: all accepted with a signature. The risk stays, only the decision is on record.',
      nShort: 'Too few holders: {list}.',
      shortItem: '{duty} ({h} of {r})',
      nLogs: '{who}: the control does not hold, because they can delete the logs the review reads.',
      nForced: 'A team of {n} (office {o}, IT {i}) cannot separate everything; the fewest conflicts possible: {m}.',
      nForcedDep: 'A team of {n} (office {o}, IT {i}) with deputies cannot separate everything; the fewest conflicts possible: {m}.',
      nAvoidable: 'This team could still separate {k} (the S key shares the duties out with the fewest conflicts).',
      msgMove: '{duty}: {from} → {to}.',
      msgShare: 'Duties shared out with the fewest conflicts.',
      rejOffice: '{who} works in the office, and IT runs production and the backups.',
      rejIT: '{who} works in IT, and the office handles the firm\'s money.',
      rejSplit: '{who}, {pair}: nobody else can take either of the two duties. Add a control or accept the risk.',

      foot: 'Simplified, not legal advice. The firm and the people are made up.',

      explain:
        '<p>Some duties must not be held by the same person, because they could make an error or commit fraud and hide it ' +
        'themselves: request and approve a purchase, create a supplier and pay it, write code and deploy it to ' +
        'production, run the backups and manage the logs that record them. That is <b>segregation of duties</b>, and ' +
        'such a pair a <b>toxic combination</b>.</p>' +
        '<ul>' +
        '<li>A <b>conflict matrix</b> lists the forbidden pairs. The check is mechanical: for each pair, who holds ' +
        'both halves? The cells below the diagonal count the people holding both duties; the diagonal counts the ' +
        'holders of each duty.</li>' +
        '<li><b>Split:</b> one duty moves to someone who may hold it and does not hold the other half. The error is ' +
        'then prevented before it happens.</li>' +
        '<li>A <b>compensating control</b>: when separation is not possible, someone independent regularly reviews ' +
        'a log of what the person did. It helps only if the person cannot change or delete that log, and it finds an ' +
        'abuse only afterwards.</li>' +
        '<li><b>Accepting the risk</b> with management\'s signature: the decision is on record, but nothing finds an ' +
        'abuse.</li>' +
        '</ul>' +
        '<p>A small team cannot always separate: in a team of three the only person in IT both writes the code and ' +
        'deploys it. A <b>deputy</b> for every duty (for holidays and sick leave) needs twice the people: with ' +
        'deputies everything separates only from eight. Related: the <b>four-eyes principle</b> (a second ' +
        'signature on every request) and how access piles up with joiners, movers and leavers.</p>' +
        '<p>Sources: ISO/IEC 27001:2022, control 5.3 (segregation of duties); NIS2, Directive (EU) 2022/2555, ' +
        'art. 21(2)(i): access control policies.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
