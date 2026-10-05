/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the stp page, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural
   forms (hr: 1 / 2–4 / 5+, en: 1 / other). The title and subtitle come from sim.json (title, concept).
   The spanning-tree terms are not in kit/glossary.js yet (NOTES.md "Term pairs"), so the pairs are written out. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Preklopnici, veze i BPDU-ovi',
      sideTitle: 'Priključci i pohranjeni BPDU',
      thPort: 'Prik.',
      thRole: 'Uloga',
      thState: 'Stanje',
      thStored: 'Pohranjeni BPDU',
      ownInfo: 'vlastiti',
      ageVal: '{s} s',
      none: '—',
      believes: 'korijen {r}, trošak {c}',
      believesRp: 'korijen {r}, trošak {c}, korijenski priključak p{p}',
      selfRoot: 'sam je korijen',
      stBlocking: 'blokiranje',
      stListening: 'osluškivanje',
      stLearning: 'učenje',
      stForwarding: 'prosljeđivanje',
      stDisabled: 'isključen',
      symR: 'R',
      symD: 'D',
      symX: '✕',
      symOff: '–',
      endLabel: 'p{p} {r}',
      endBare: 'p{p}',
      portOf: '{b} p{p}',
      timeT: 't = {t} s',
      sinceCut: 'od prekida: {s} s',
      timers: 'hello 2 s · max age 20 s · forward delay 15 s',
      floodTitle: 'Bez STP-a',
      inFlight: 'Kopija u letu',
      total: 'Ukupno poslano',
      recvBy: '{h} primio',
      noTtl: 'Okvir nema TTL: ništa ga ne zaustavlja.',
      bRoot: '★ korijen',
      bClaims: 'misli: korijen',
      bSends: 'šalje',
      bGot: '✓ {n}×',
      chipBpdu: '⟨{r}, {c}, {b}, {p}⟩',
      chipFrame: '#{k}',
      chipCopies: '×{n}',
      wBroadcast: 'broadcast',

      pStp: 'STP uključen',
      pPrio: 'Prior. {s}',
      pCut: 'Prekid veze u t = 40 s',
      cutNone: 'ne',
      pSlow: 'Spora veza (100 Mb/s, trošak 19)',
      slowNone: 'nema',
      prNoStp: 'Bez STP-a: petlja',
      prTriangle: 'Trokut: isti trošak',
      prPriority: 'S3 s prioritetom 4096',
      prCost: 'Spora veza ne nosi promet',
      prPortId: 'Dvije veze: ID priključka',
      prReconverge: 'Prekid S1–S2',
      prReconvergeHint: 'Prekid u t = 40 s; S3 čeka da istekne max age (20 s).',
      prNoStpHint: 'Jedan broadcast kruži zauvijek.',

      legRootBridge: 'korijenski most',
      legR: 'korijenski priključak',
      legD: 'određeni priključak',
      legX: 'blokirani priključak',
      legBpdu: 'BPDU ⟨korijen, trošak, pošiljatelj, priključak⟩',
      legFrame: 'broadcast okvir',
      legChanged: 'promijenjeno u ovom koraku',

      capPower: 'Preklopnici su upravo uključeni. Svaki misli da je on korijen, a svi su priključci u blokiranju. Pritisni → za prve BPDU-ove.',
      capClaims: 't = 0 s: svaki preklopnik na svakom priključku šalje BPDU u kojem tvrdi da je on korijen. Svaki pamti bolji koji čuje: {list}. Priključci R i D počinju osluškivati.',
      capRound: 't = {t} s: određeni priključci šalju BPDU.',
      capStable: 't = {t} s: novi krug BPDU-ova ništa ne mijenja. Stablo je gotovo: {blocked} blokira petlju.',
      capStableNone: 't = {t} s: novi krug BPDU-ova ništa ne mijenja. Nijedan priključak ne blokira: petlje više nema.',
      capLearning: 't = {t} s: prošlo je 15 s (forward delay). Osluškivanje → učenje: {ports}. Priključak u učenju puni tablicu MAC adresa, ali još ne prosljeđuje okvire.',
      capForwarding: 't = {t} s: još 15 s. Učenje → prosljeđivanje: {ports}. Okviri sada idu stablom.',
      capForwardingBlocked: 't = {t} s: još 15 s. Učenje → prosljeđivanje: {ports}. Okviri sada idu stablom; {blocked} ostaje u blokiranju.',
      allRD: 'svi priključci R i D',
      capCut: 't = {t} s: veza {l} je prekinuta.',
      cutClaim: '{b} je izgubio korijenski priključak i sad tvrdi da je on korijen. {n} taj lošiji BPDU odbacuje: na tom priključku već čuva bolji.',
      cutClaimFree: '{b} je izgubio korijenski priključak i sad tvrdi da je on korijen.',
      cutAlt: '{b} je izgubio korijenski priključak, ali na {p} već čuva BPDU od {n}: {p} odmah postaje korijenski (trošak {c}) i počinje osluškivati. Izravni kvar ne čeka max age.',
      cutNothing: 'Na toj je vezi bio blokirani priključak: promet ionako nije išao njome, pa se stablo ne mijenja.',
      capAged: 't = {t} s ({s} s od prekida): {b} 20 s nije čuo BPDU koji bi osvježio podatak pohranjen na {p}, pa on istječe (max age).',
      roleToD: '{p} postaje određeni i počinje osluškivati; prosljeđivat će tek nakon 15 s osluškivanja i 15 s učenja.',
      newRootPortListen: '{b} uzima p{p} kao novi korijenski priključak (trošak {c}); on počinje osluškivati.',
      capStableWait: 't = {t} s: novi krug BPDU-ova ništa ne mijenja, ali stablo još nije gotovo.',
      newRootPort: '{b} uzima p{p} kao novi korijenski priključak (trošak {c}).',
      stillIgnored: '{b} i dalje odbacuje lošiji BPDU od {n}: pohranjeni je star {a} s, a istječe nakon 20 s.',
      whyBlockBid: '{b} na priključku p{p} prima BPDU s istim troškom do korijena ({c}). Odlučuje niži ID mosta: {n} pobjeđuje, priključak na {b} prelazi u blokiranje.',
      whyBlockCost: '{b} na priključku p{p} čuje bolju ponudu: trošak {c1} prema svojih {c2}. Priključak prelazi u blokiranje.',
      whyBlockPort: '{b} na priključku p{p} prima BPDU s istim troškom i od istog mosta; odlučuje niži ID priključka pošiljatelja ({pid}). Priključak prelazi u blokiranje.',
      whyBlockRoot: '{b} na priključku p{p} čuje BPDU s boljim korijenom ({r}). Priključak prelazi u blokiranje.',
      whyRootOnly: '{b}: korijen {r}, trošak {c}, korijenski priključak p{p}.',
      whyRootCost: '{b}: korijenski priključak je p{p}, trošak {c} (drugi put košta {alt}).',
      whyRootBid: '{b}: oba puta koštaju {c}; odlučuje niži ID mosta pošiljatelja ({n}), pa je korijenski priključak p{p}.',
      whyRootPort: '{b}: isti trošak ({c}), isti pošiljatelj ({n}); odlučuje niži ID priključka pošiljatelja, {pid}, pa je korijenski priključak p{p}, a drugi priključak blokira. Vlastiti brojevi priključaka ovdje ne odlučuju.',
      whyRootOwn: '{b}: sve je jednako do vlastitog priključka; niži ID priključka odlučuje: p{p}.',
      capFrame: '{h} šalje {bc}. Okvir stiže do svakog preklopnika jednom; kopiju koju {from} šalje prema {to} odbacuje blokirani priključak. Petlje nema.',
      capFrameFree: '{h} šalje {bc}. Okvir stiže do svakog preklopnika jednom i tu staje.',
      recvList: '{h} je primio {n}.',
      capFloodPre: 'STP je isključen, a preklopnici su spojeni u petlju. Pritisni → i H1 šalje jedan broadcast okvir.',
      capFlood1: 'STP je isključen. {h} šalje jedan {bc} okvir.',
      capFlood: 'Svaki preklopnik šalje svaku primljenu kopiju na sve ostale priključke. U letu: {f}, ukupno poslano {total}.',
      floodRecv: ['{h} je dosad primio {n} kopiju istog okvira.', '{h} je dosad primio {n} kopije istog okvira.', '{h} je dosad primio {n} kopija istog okvira.'],
      floodNever: 'Okvir nema TTL, pa ovo nikad ne prestaje: broadcast oluja.',
      copies: ['{n} kopiju', '{n} kopije', '{n} kopija'],
      listSep: '; ',
      andSep: ' i ',

      explain: '<p><i>Spanning tree protocol</i> (protokol razapinjućeg stabla, STP) od mreže preklopnika s petljom ' +
        'pravi stablo: na svakoj petlji jedan priključak blokira. Bez toga bi jedan <i>broadcast</i> kružio zauvijek ' +
        '(<i>broadcast</i> oluja), jer Ethernet okvir nema TTL.</p>' +
        '<p>Preklopnici razmjenjuju BPDU-ove ⟨ID korijena, trošak do korijena, ID pošiljatelja, ID priključka⟩. ' +
        '<i>Bridge ID</i> (identifikator mosta) je prioritet (zadano 32768) pa MAC adresa; niži je bolji. BPDU-ovi se ' +
        'uspoređuju polje po polje, prva razlika odlučuje.</p>' +
        '<ol><li><i>Root bridge</i> (korijenski most): najniži ID mosta u mreži. Svi su mu priključci određeni.</li>' +
        '<li><i>Root port</i> (korijenski priključak), jedan po preklopniku: najmanji <i>path cost</i> (trošak puta) do ' +
        'korijena; kod jednakog troška niži ID mosta pošiljatelja, pa niži ID priključka pošiljatelja (njegov, ne vlastiti).</li>' +
        '<li><i>Designated port</i> (određeni priključak), jedan po vezi: onaj s najboljim BPDU-om za tu vezu.</li>' +
        '<li>Svi ostali su u <i>blocking</i> (blokiranju): primaju BPDU-ove, ali ne prosljeđuju okvire.</li></ol>' +
        '<p>Trošak veze (kratke vrijednosti iz 802.1D-1998): 10 Mb/s = 100, 100 Mb/s = 19, 1 Gb/s = 4, 10 Gb/s = 2. ' +
        'Priključak koji postane R ili D ide kroz osluškivanje (15 s) i učenje (15 s) do prosljeđivanja. Lošiji BPDU ' +
        'na blokiranom priključku zanemaruje se dok pohranjeni ne istekne (max age, 20 s): neizravni kvar traje oko ' +
        '20 + 15 + 15 = 50 s, izravni oko 30 s.</p>' +
        '<p>Imena S1, S2, S3 na BPDU-ovima stoje umjesto punog ID-a mosta (prioritet.MAC). Klasični STP, ne RSTP.</p>'
    },
    en: {
      stage: 'Switches, links and BPDUs',
      sideTitle: 'Ports and stored BPDUs',
      thPort: 'Port',
      thRole: 'Role',
      thState: 'State',
      thStored: 'Stored BPDU',
      ownInfo: 'own',
      ageVal: '{s} s',
      none: '—',
      believes: 'root {r}, cost {c}',
      believesRp: 'root {r}, cost {c}, root port p{p}',
      selfRoot: 'is the root',
      stBlocking: 'blocking',
      stListening: 'listening',
      stLearning: 'learning',
      stForwarding: 'forwarding',
      stDisabled: 'disabled',
      symR: 'R',
      symD: 'D',
      symX: '✕',
      symOff: '–',
      endLabel: 'p{p} {r}',
      endBare: 'p{p}',
      portOf: '{b} p{p}',
      timeT: 't = {t} s',
      sinceCut: 'since the cut: {s} s',
      timers: 'hello 2 s · max age 20 s · forward delay 15 s',
      floodTitle: 'No STP',
      inFlight: 'Copies in flight',
      total: 'Sent in total',
      recvBy: '{h} received',
      noTtl: 'A frame has no TTL: nothing stops it.',
      bRoot: '★ root',
      bClaims: 'thinks: root',
      bSends: 'sends',
      bGot: '✓ {n}×',
      chipBpdu: '⟨{r}, {c}, {b}, {p}⟩',
      chipFrame: '#{k}',
      chipCopies: '×{n}',
      wBroadcast: 'broadcast',

      pStp: 'STP on',
      pPrio: 'Priority {s}',
      pCut: 'Cut a link at t = 40 s',
      cutNone: 'no',
      pSlow: 'Slow link (100 Mb/s, cost 19)',
      slowNone: 'none',
      prNoStp: 'No STP: the loop',
      prTriangle: 'Triangle: equal costs',
      prPriority: 'S3 with priority 4096',
      prCost: 'The slow link carries nothing',
      prPortId: 'Two links: port ID',
      prReconverge: 'Cut S1–S2',
      prReconvergeHint: 'Cut at t = 40 s; S3 waits for max age (20 s).',
      prNoStpHint: 'One broadcast circles forever.',

      legRootBridge: 'root bridge',
      legR: 'root port',
      legD: 'designated port',
      legX: 'blocked port',
      legBpdu: 'BPDU ⟨root, cost, sender, port⟩',
      legFrame: 'broadcast frame',
      legChanged: 'changed in this step',

      capPower: 'The switches have just been switched on. Each believes it is the root, and every port is blocking. Press → for the first BPDUs.',
      capClaims: 't = 0 s: every switch sends a BPDU on every port, claiming to be the root. Each keeps the better one it hears: {list}. R and D ports start listening.',
      capRound: 't = {t} s: the designated ports send BPDUs.',
      capStable: 't = {t} s: another round of BPDUs changes nothing. The tree is done: {blocked} blocks the loop.',
      capStableNone: 't = {t} s: another round of BPDUs changes nothing. No port blocks: there is no loop any more.',
      capLearning: 't = {t} s: 15 s have passed (forward delay). Listening → learning: {ports}. A learning port fills the MAC table but forwards no frames yet.',
      capForwarding: 't = {t} s: another 15 s. Learning → forwarding: {ports}. Frames now follow the tree.',
      capForwardingBlocked: 't = {t} s: another 15 s. Learning → forwarding: {ports}. Frames now follow the tree; {blocked} stays blocking.',
      allRD: 'every R and D port',
      capCut: 't = {t} s: the link {l} is cut.',
      cutClaim: '{b} has lost its root port and now claims to be the root itself. {n} ignores this inferior BPDU: it already holds a better one on that port.',
      cutClaimFree: '{b} has lost its root port and now claims to be the root itself.',
      cutAlt: '{b} has lost its root port, but it already holds a BPDU from {n} on {p}: {p} becomes the root port at once (cost {c}) and starts listening. A direct failure does not wait for max age.',
      cutNothing: 'That link had the blocked port: no traffic used it anyway, so the tree does not change.',
      capAged: 't = {t} s ({s} s since the cut): {b} has heard no BPDU for 20 s that refreshes the information stored on {p}, so it ages out (max age).',
      roleToD: '{p} becomes designated and starts listening; it forwards only after 15 s listening and 15 s learning.',
      newRootPortListen: '{b} takes p{p} as its new root port (cost {c}); it starts listening.',
      capStableWait: 't = {t} s: another round of BPDUs changes nothing, but the tree is not done yet.',
      newRootPort: '{b} takes p{p} as its new root port (cost {c}).',
      stillIgnored: '{b} still ignores the inferior BPDU from {n}: the stored one is {a} s old and expires at 20 s.',
      whyBlockBid: '{b} receives on port p{p} a BPDU with the same root path cost ({c}). The lower bridge ID decides: {n} wins, and {b}\'s port goes to blocking.',
      whyBlockCost: '{b} hears a better offer on port p{p}: cost {c1} against its own {c2}. The port goes to blocking.',
      whyBlockPort: '{b} receives on port p{p} a BPDU with the same cost from the same bridge; the lower sender port ID decides ({pid}). The port goes to blocking.',
      whyBlockRoot: '{b} hears a BPDU with a better root ({r}) on port p{p}. The port goes to blocking.',
      whyRootOnly: '{b}: root {r}, cost {c}, root port p{p}.',
      whyRootCost: '{b}: the root port is p{p}, cost {c} (the other way costs {alt}).',
      whyRootBid: '{b}: both ways cost {c}; the lower sender bridge ID decides ({n}), so the root port is p{p}.',
      whyRootPort: '{b}: same cost ({c}), same sender ({n}); the lower sender port ID, {pid}, decides, so the root port is p{p} and the other port blocks. Its own port numbers do not decide here.',
      whyRootOwn: '{b}: everything is equal up to its own port; the lower port ID decides: p{p}.',
      capFrame: '{h} sends a {bc}. The frame reaches every switch once; the copy {from} sends towards {to} is discarded by the blocked port. No loop.',
      capFrameFree: '{h} sends a {bc}. The frame reaches every switch once and stops there.',
      recvList: '{h} received {n}.',
      capFloodPre: 'STP is off, and the switches are wired in a loop. Press → and H1 sends one broadcast frame.',
      capFlood1: 'STP is off. {h} sends one {bc} frame.',
      capFlood: 'Every switch sends every copy it received out of all its other ports. In flight: {f}, sent in total {total}.',
      floodRecv: ['{h} has received {n} copy of the same frame so far.', '{h} has received {n} copies of the same frame so far.'],
      floodNever: 'A frame has no TTL, so this never stops: a broadcast storm.',
      copies: ['{n} copy', '{n} copies'],
      listSep: '; ',
      andSep: ' and ',

      explain: '<p>The <i>spanning tree protocol</i> (STP) turns a network of switches with a loop into a tree: on every ' +
        'loop one port blocks. Without it one broadcast would circle forever (a broadcast storm), because an Ethernet ' +
        'frame has no TTL.</p>' +
        '<p>Switches exchange BPDUs ⟨root ID, root path cost, sender ID, port ID⟩. The <i>bridge ID</i> is the priority ' +
        '(default 32768) followed by the MAC address; lower is better. BPDUs are compared field by field, and the first ' +
        'difference decides.</p>' +
        '<ol><li><i>Root bridge</i>: the lowest bridge ID in the network. All its ports are designated.</li>' +
        '<li><i>Root port</i>, one per switch: the lowest <i>path cost</i> to the root; on a tie the lower sender bridge ' +
        'ID, then the lower sender port ID (the neighbour\'s, not its own).</li>' +
        '<li><i>Designated port</i>, one per link: the one with the best BPDU for that link.</li>' +
        '<li>Every other port is <i>blocking</i>: it receives BPDUs but forwards no frames.</li></ol>' +
        '<p>Link cost (802.1D-1998 short values): 10 Mb/s = 100, 100 Mb/s = 19, 1 Gb/s = 4, 10 Gb/s = 2. A port that ' +
        'becomes R or D goes through listening (15 s) and learning (15 s) to forwarding. An inferior BPDU on a blocked ' +
        'port is ignored until the stored one expires (max age, 20 s): an indirect failure takes about 20 + 15 + 15 = ' +
        '50 s, a direct one about 30 s.</p>' +
        '<p>The names S1, S2, S3 on the BPDUs stand for the full bridge ID (priority.MAC). Classic STP, not RSTP.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
