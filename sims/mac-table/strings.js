/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of mac-table, in both languages (docs/sim-ui.md §9). Croatian is the original (the URM book's
   fragment tablica-mac-adresa.html and chapter 7); English is written for simdeck. Croatian terms follow the book:
   preklopnik, priključak, okvir, tablica MAC adresa, samoučenje, preplavljivanje, izvorišna i odredišna adresa.
   Terms missing from kit/glossary.js (switch, port, MAC address table, self-learning) are written out in both
   tables; the pairs are listed in NOTES.md. Host letters and port numbers are data, not words: the page puts them in
   translate="no" elements. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Preklopnik s tri priključka i njegova tablica MAC adresa',
      switchName: 'Preklopnik',
      portN: 'priključak {port}',
      tableTitle: 'Tablica MAC adresa',
      colMac: 'MAC adresa (uređaj)',
      colPort: 'priključak',
      colTime: 'zadnji okvir',
      timeEarlier: 'ranije',
      timeFrame: 'okvir {k}',
      tableEmpty: 'Tablica je prazna: preklopnik još ništa nije naučio.',
      frameNone: 'Na vezama još nema okvira.',
      frameLine: 'Okvir {k} od 3: odredište {dst}, izvor {src}',
      lookupFound: 'Traži se odredište {dst}: priključak {port}',
      lookupMissing: 'Traži se odredište {dst}: nema zapisa',
      linkIn: 'ulazi',
      linkForward: 'ciljano',
      linkCopy: 'kopija',
      roleSends: 'šalje',
      roleGets: 'prima okvir',
      roleGetsCopy: 'prima kopiju',
      roleBystander: 'kopija nije za njega',
      roleNothing: 'ne prima ništa',
      pair: 'Razgovor',
      pairOption: '{src} šalje {dst}-u',
      knowA: 'A već u tablici',
      knowB: 'B već u tablici',
      knowC: 'C već u tablici',
      presetBook: 'Primjer iz knjige',
      presetBookHint: 'Poglavlje 7, Primjer 2: tablica zna samo C na priključku 3, A šalje okvir B-u. Koji priključci ' +
        'prime kopiju, i vidi li C taj promet?',
      presetLearn: 'Prazna tablica',
      presetLearnHint: 'Poglavlje 7: preklopnik s praznom tablicom, A šalje B-u, B odgovara. Što preklopnik nauči iz ' +
        'kojeg okvira?',
      presetReply: 'B šalje C-u',
      presetReplyHint: 'Tablica je prazna, B šalje okvir C-u. Hoće li se taj okvir preplaviti? A C-ov odgovor B-u?',
      presetSource: 'Izvor, ne odredište',
      presetSourceHint: 'Tablica već zna A. A šalje B-u. Zašto preklopnik upisuje izvorišnu adresu okvira, a ne ' +
        'odredišnu?',
      legendCopy: 'kopija (preplavljivanje)',
      legendNew: 'upisano u ovom koraku',
      captionIdleEmpty: 'Preklopnik ima tri priključka: A na 1, B na 2, C na 3. Tablica MAC adresa je prazna. ' +
        '{src} će poslati okvir {dst}-u. Pritisni →.',
      captionIdle: 'Preklopnik ima tri priključka: A na 1, B na 2, C na 3. Tablica MAC adresa već zna: {known}. ' +
        '{src} će poslati okvir {dst}-u. Pritisni →.',
      knownItem: '{mac} na priključku {port}',
      listAnd: ' i ',
      captionLearnNew: 'Okvir {k} stiže od {src} na priključak {port}. Preklopnik upisuje izvorišnu adresu: ' +
        '{src} je na priključku {port}. Kamo okvir ide, za taj upis nije važno.',
      captionLearnRefresh: 'Okvir {k} stiže od {src} na priključak {port}. {src} je već u tablici: zapis se samo ' +
        'osvježi novim vremenom, drugi se ne dodaje.',
      captionForward: '{dst} je u tablici, na priključku {port}: preklopnik šalje okvir ciljano, samo na taj ' +
        'priključak. Bez preplavljivanja.',
      captionFlood: '{dst} nije u tablici: preklopnik preplavljuje, kopija ide na sve priključke osim priključka ' +
        '{in}, s kojeg je okvir stigao. {by} vidi okvir koji mu nije namijenjen.',
      captionFloodKnown: '{dst} nije u tablici: preklopnik preplavljuje, kopija ide na sve priključke osim ' +
        'priključka {in}, s kojeg je okvir stigao. {by} vidi okvir koji mu nije namijenjen, iako preklopnik zna gdje je: odluka ovisi ' +
        'samo o odredištu.',
      captionDone: 'Oba su priključka sad poznata: između {a} i {b} se više ništa ne preplavljuje.',
      explain: '<p><em lang="en">Switch</em> (preklopnik) gradi svoju <em lang="en">MAC address table</em> (tablica ' +
        'MAC adresa) sam, promatranjem prometa: to je <em lang="en">self-learning</em> (samoučenje). Za svaki okvir ' +
        'koji stigne upisuje <strong>izvorišnu</strong> adresu, <em lang="en">port</em> (priključak) s kojeg je stigao ' +
        'i vrijeme. Ništa u tom upisu ne ovisi o tome kamo je okvir upućen: preklopnik uči tko je pošiljatelj, ne tko ' +
        'je primatelj, jer jedino izvorišna adresa govori odakle je okvir upravo došao.</p>' +
        '<p>Kad odredišna adresa nije u tablici, preklopnik ne zna kamo drugdje poslati okvir osim posvuda: šalje po ' +
        'jednu kopiju na sve priključke osim onog s kojeg je okvir stigao. To je [[flooding]], i kopiju prime i ' +
        'uređaji koji s razgovorom nemaju nikakve veze. Što preklopnik zna o nekom trećem uređaju tu ne pomaže: ' +
        'odluka ovisi samo o odredištu okvira koji se upravo šalje. Tek kad je odredište u tablici, okvir ide ciljano, ' +
        'na točno jedan priključak.</p>' +
        '<p>Zapis ne ostaje zauvijek: preklopnik ga briše kad od te adrese dulje vrijeme ne stigne ništa, po zadanoj ' +
        'vrijednosti nakon 300 sekundi. Bez toga bi tablica pamtila uređaje koji su odavno premješteni ili ' +
        'isključeni.</p>'
    },
    en: {
      stage: 'A switch with three ports and its MAC address table',
      switchName: 'Switch',
      portN: 'port {port}',
      tableTitle: 'MAC address table',
      colMac: 'MAC address (host)',
      colPort: 'port',
      colTime: 'last frame',
      timeEarlier: 'earlier',
      timeFrame: 'frame {k}',
      tableEmpty: 'The table is empty: the switch has learned nothing yet.',
      frameNone: 'No frame on the links yet.',
      frameLine: 'Frame {k} of 3: destination {dst}, source {src}',
      lookupFound: 'Looking up destination {dst}: port {port}',
      lookupMissing: 'Looking up destination {dst}: no entry',
      linkIn: 'in',
      linkForward: 'forwarded',
      linkCopy: 'copy',
      roleSends: 'sends',
      roleGets: 'gets the frame',
      roleGetsCopy: 'gets a copy',
      roleBystander: 'copy not meant for it',
      roleNothing: 'gets nothing',
      pair: 'Conversation',
      pairOption: '{src} sends to {dst}',
      knowA: 'A already in the table',
      knowB: 'B already in the table',
      knowC: 'C already in the table',
      presetBook: 'The book\'s example',
      presetBookHint: 'Chapter 7, Example 2: the table knows only C on port 3, and A sends a frame to B. Which ports ' +
        'get a copy, and does C see that traffic?',
      presetLearn: 'Empty table',
      presetLearnHint: 'Chapter 7: a switch with an empty table, A sends to B, B replies. What does the switch learn ' +
        'from which frame?',
      presetReply: 'B sends to C',
      presetReplyHint: 'The table is empty and B sends a frame to C. Will that frame be flooded? And C\'s reply to B?',
      presetSource: 'Source, not destination',
      presetSourceHint: 'The table already knows A. A sends to B. Why does the switch write the frame\'s source ' +
        'address and not its destination?',
      legendCopy: 'copy (flooding)',
      legendNew: 'written in this step',
      captionIdleEmpty: 'The switch has three ports: A on 1, B on 2, C on 3. The MAC address table is empty. ' +
        '{src} is going to send a frame to {dst}. Press →.',
      captionIdle: 'The switch has three ports: A on 1, B on 2, C on 3. The MAC address table already knows: ' +
        '{known}. {src} is going to send a frame to {dst}. Press →.',
      knownItem: '{mac} on port {port}',
      listAnd: ' and ',
      captionLearnNew: 'Frame {k} arrives from {src} on port {port}. The switch writes the source address: {src} is ' +
        'on port {port}. Where the frame goes does not matter for this entry.',
      captionLearnRefresh: 'Frame {k} arrives from {src} on port {port}. {src} is already in the table: the entry ' +
        'only gets the new time, no second one is added.',
      captionForward: '{dst} is in the table, on port {port}: the switch forwards the frame to that one port only. ' +
        'No flooding.',
      captionFlood: '{dst} is not in the table: the switch floods, a copy goes to every port except port {in}, ' +
        'the one the frame came in on. {by} sees a frame not meant for it.',
      captionFloodKnown: '{dst} is not in the table: the switch floods, a copy goes to every port except port ' +
        '{in}, the one the frame came in on. {by} sees a frame not meant for it, although the switch knows where it is: the ' +
        'decision depends on the destination only.',
      captionDone: 'Both ports are known now: nothing between {a} and {b} is flooded any more.',
      explain: '<p>A switch builds its MAC address table by itself, by watching the traffic: this is self-learning. ' +
        'For every frame that arrives it writes the <strong>source</strong> address, the port it came in on and the ' +
        'time. Nothing in that entry depends on where the frame is going: the switch learns who the sender is, not ' +
        'who the receiver is, because only the source address says where the frame has just come from.</p>' +
        '<p>When the destination address is not in the table, the switch knows nowhere to send the frame but ' +
        'everywhere: it sends one copy to every port except the one the frame came in on. This is [[flooding]], and ' +
        'hosts that have nothing to do with the conversation get a copy too. What the switch knows about some third ' +
        'host does not help: the decision depends only on the destination of the frame being sent. Only when the ' +
        'destination is in the table does the frame go to exactly one port.</p>' +
        '<p>An entry does not stay for ever: the switch deletes it when nothing has come from that address for a ' +
        'while, by default after 300 seconds. Without that, the table would remember hosts that were moved or ' +
        'switched off long ago.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
